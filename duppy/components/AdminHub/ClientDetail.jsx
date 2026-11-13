"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "./api";
import { Password } from "./Clients";
import Invoices from "./Invoices";
import Charts, { PLATFORMS, shortDate } from "@/components/Portal/Charts";

const STATUS = [
  ["in_progress", "In progress"],
  ["review", "Review"],
  ["done", "Done"],
];

const today = () => new Date().toISOString().slice(0, 10);
const emptyWeek = () => ({ week: today(), report: "", tiktok: {}, instagram: {}, youtube: {} });

function Deliverable({ item, team, onSave, onDelete }) {
  const [d, setD] = useState(item);
  useEffect(() => setD(item), [item]);
  const change = (patch) => {
    const next = { ...d, ...patch };
    setD(next);
    return next;
  };
  return (
    <div className="hub-dlv">
      <input
        className="field"
        aria-label="Deliverable"
        value={d.title}
        onChange={(e) => change({ title: e.target.value })}
        onBlur={() => d.title !== item.title && onSave(d)}
      />
      <input className="field" type="date" aria-label="Due date" value={d.due_date || ""} onChange={(e) => onSave(change({ due_date: e.target.value }))} />
      <select className="field" aria-label="Status" value={d.status} onChange={(e) => onSave(change({ status: e.target.value }))}>
        {STATUS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <select className="field" aria-label="Assigned to" value={d.assignee || ""} onChange={(e) => onSave(change({ assignee: e.target.value }))}>
        <option value="">Unassigned</option>
        {team.map((m) => <option key={m.email} value={m.email}>{m.name}</option>)}
      </select>
      <button className="btn sm quiet danger" type="button" onClick={() => onDelete(d)}>Remove</button>
    </div>
  );
}

export default function ClientDetail({ id, admin }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [password, setPassword] = useState(null);
  const [title, setTitle] = useState("");
  const [week, setWeek] = useState(emptyWeek);
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await api(`/clients/${id}`);
      setData(d);
      setNotes(d.client.notes || "");
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn, message) => {
    setError("");
    try {
      await fn();
      if (message) setSaved(message);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const saveDeliverable = (d) => run(() => api(`/clients/${id}/deliverables`, { method: "POST", body: d }));
  const removeDeliverable = (d) =>
    window.confirm(`Remove "${d.title}"?`) && run(() => api(`/clients/${id}/deliverables?id=${d.id}`, { method: "DELETE" }));

  function addDeliverable(e) {
    e.preventDefault();
    run(() => api(`/clients/${id}/deliverables`, { method: "POST", body: { title } })).then(() => setTitle(""));
  }

  // Picking a week that already has numbers loads them for editing.
  function pickWeek(date) {
    const monday = (() => {
      const d = new Date(`${date}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
      return d.toISOString().slice(0, 10);
    })();
    const next = { ...emptyWeek(), week: date };
    for (const row of data.stats.filter((s) => s.week === monday)) {
      next[row.platform] = { followers: row.followers ?? "", views: row.views ?? "" };
    }
    next.report = data.reports.find((r) => r.week === monday)?.body || "";
    setWeek(next);
  }

  function saveWeek(e) {
    e.preventDefault();
    run(() => api(`/clients/${id}/weeks`, { method: "POST", body: week }), "Week saved. The client sees it in their portal.");
  }

  async function reset() {
    if (!window.confirm("Create a new password? The current one stops working and the client is signed out.")) return;
    try {
      setPassword((await api(`/clients/${id}/password`, { method: "POST" })).password);
    } catch (e) {
      setError(e.message);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete ${data.client.name} with all deliverables and numbers? This cannot be undone.`)) return;
    try {
      await api(`/clients/${id}`, { method: "DELETE" });
      window.location.href = "/adminhub/clients";
    } catch (e) {
      setError(e.message);
    }
  }

  if (!data) return error ? <p className="note bad" role="alert">{error}</p> : <p className="muted">Loading client…</p>;
  const { client, deliverables, stats, reports, team } = data;
  const setNumber = (platform, key) => (e) => setWeek({ ...week, [platform]: { ...week[platform], [key]: e.target.value } });

  return (
    <>
      <header className="hub-head hero" style={{ "--art": "url(/brand/bg-hero-portal.jpg)" }}>
        <div>
          <Link className="tag" href="/adminhub/clients">← Clients_</Link>
          <h1>{client.name}</h1>
          <p className="lede">{client.email}</p>
        </div>
        <div className="row">
          <select
            className="field"
            style={{ width: 130 }}
            aria-label="Client status"
            value={client.status}
            onChange={(e) => run(() => api(`/clients/${id}`, { method: "PATCH", body: { status: e.target.value } }))}
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="ended">Ended</option>
          </select>
          {admin && <button className="btn" type="button" onClick={reset}>New portal password</button>}
        </div>
      </header>

      {error && <p className="note bad" role="alert" style={{ marginBottom: 16 }}>{error}</p>}
      {saved && <p className="note ok" role="status" style={{ marginBottom: 16 }}>{saved}</p>}
      {password && <div style={{ marginBottom: 16 }}><Password value={password} email={client.email} /></div>}

      <div className="stack" style={{ gap: 18 }}>
        <section className="panel stack">
          <h2>Deliverables</h2>
          {deliverables.length === 0 && <p className="muted">Nothing yet. Add what you are delivering this month.</p>}
          <div>
            {deliverables.map((d) => (
              <Deliverable key={d.id} item={d} team={team} onSave={saveDeliverable} onDelete={removeDeliverable} />
            ))}
          </div>
          <form className="row" onSubmit={addDeliverable}>
            <input className="field grow" required placeholder="e.g. 12 clips from the October podcast episodes" value={title} onChange={(e) => setTitle(e.target.value)} />
            <button className="btn primary" type="submit">Add deliverable</button>
          </form>
        </section>

        {admin && <Invoices clientId={id} />}

        <section className="panel stack">
          <h2>Weekly update</h2>
          <p className="muted">Enter this week&apos;s numbers and a short report. Pick a past week to correct it.</p>
          <form className="stack" onSubmit={saveWeek}>
            <label className="lbl" style={{ maxWidth: 200 }}>
              Week of
              <input className="field" type="date" required value={week.week} onChange={(e) => pickWeek(e.target.value)} />
            </label>
            {PLATFORMS.map((p) => (
              <div className="hub-week" key={p.key}>
                <span className="tag" style={{ color: p.color }}>{p.label}</span>
                <input className="field" type="number" min="0" inputMode="numeric" placeholder="Followers" aria-label={`${p.label} followers`} value={week[p.key].followers ?? ""} onChange={setNumber(p.key, "followers")} />
                <input className="field" type="number" min="0" inputMode="numeric" placeholder="Views this week" aria-label={`${p.label} views this week`} value={week[p.key].views ?? ""} onChange={setNumber(p.key, "views")} />
              </div>
            ))}
            <label className="lbl">
              Weekly report for the client
              <textarea className="field" rows={5} value={week.report} onChange={(e) => setWeek({ ...week, report: e.target.value })} placeholder="What we shipped, what worked, what is next." />
            </label>
            <div><button className="btn primary" type="submit">Save week</button></div>
          </form>
        </section>

        <section className="stack">
          <h2>What the client sees</h2>
          <Charts stats={stats} />
          {reports.slice(0, 3).map((r) => (
            <article className="panel stack" key={r.id}>
              <span className="tag blue">Week of {shortDate(r.week)}</span>
              <p style={{ whiteSpace: "pre-wrap" }}>{r.body}</p>
            </article>
          ))}
        </section>

        <section className="panel stack">
          <h2>Internal notes</h2>
          <p className="muted">Only the team sees these.</p>
          <textarea className="field" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="row">
            <button className="btn" type="button" onClick={() => run(() => api(`/clients/${id}`, { method: "PATCH", body: { notes } }), "Notes saved.")}>Save notes</button>
            {admin && <button className="btn quiet danger" type="button" onClick={remove}>Delete client</button>}
          </div>
        </section>
      </div>
    </>
  );
}
