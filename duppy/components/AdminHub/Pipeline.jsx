"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, daysSince } from "./api";

const COLUMNS = [
  { key: "drafted", label: "Drafted", hint: "In Gmail, waiting for you to send" },
  { key: "contacted", label: "Contacted", hint: "Sent, no reply yet" },
  { key: "replied", label: "Replied" },
  { key: "call", label: "Call" },
  { key: "closed", label: "Closed" },
];
const OUT = ["cold", "bounced", "lost"];
const MOVES = ["drafted", "contacted", "replied", "call", "closed", "cold", "lost"];
const KIND = { initial: "First email", followup1: "Follow-up 1", followup2: "Follow-up 2" };

function followUpPill(lead) {
  const pending = lead.drafts.find((d) => d.kind !== "initial" && d.status === "in_gmail");
  if (pending) return <span className="pill warn">{KIND[pending.kind]} ready in Gmail</span>;
  const sent = lead.drafts.filter((d) => d.kind !== "initial" && d.status === "sent").length;
  if (sent) return <span className="pill">{sent} follow-up{sent > 1 ? "s" : ""} sent</span>;
  return null;
}

function Card({ lead, onMove }) {
  const [open, setOpen] = useState(false);
  const days = daysSince(lead.contacted_at);
  return (
    <article className="hub-card">
      <div>
        <div className="name">{lead.name}</div>
        <div className="mail">{lead.email}</div>
      </div>
      <div className="row">
        {lead.status === "contacted" && days != null && <span className="pill">Day {days}</span>}
        {lead.status === "contacted" && followUpPill(lead)}
        {lead.language === "cs" && <span className="pill info">CZ</span>}
      </div>
      <select
        className="field"
        aria-label={`Stage for ${lead.name}`}
        value={lead.status}
        onChange={(e) => onMove(lead, e.target.value)}
      >
        {MOVES.map((s) => (
          <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
        ))}
      </select>
      {lead.drafts.length > 0 && (
        <button className="btn sm quiet" type="button" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? "Hide emails" : "Show emails"}
        </button>
      )}
      {open &&
        lead.drafts.map((d) => (
          <div key={d.id} className="stack" style={{ gap: 6 }}>
            <span className="tag dim">
              {KIND[d.kind]} · {d.status === "sent" ? "sent" : "draft"}
            </span>
            <b className="small">{d.subject}</b>
            <pre>{d.body}</pre>
          </div>
        ))}
    </article>
  );
}

export default function Pipeline() {
  const [leads, setLeads] = useState(null);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [report, setReport] = useState(null);

  const load = useCallback(async () => {
    try {
      setLeads((await api("/leads")).leads);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function move(lead, status) {
    setLeads((all) => all.map((l) => (l.id === lead.id ? { ...l, status } : l)));
    try {
      await api(`/leads/${lead.id}`, { method: "PATCH", body: { status } });
    } catch (e) {
      setError(e.message);
      load();
    }
  }

  async function sync() {
    setSyncing(true);
    setReport(null);
    try {
      setReport((await api("/sync", { method: "POST" })).report);
      await load();
    } catch (e) {
      setError(e.message);
    }
    setSyncing(false);
  }

  const all = leads || [];
  const by = (status) => all.filter((l) => l.status === status);
  const contacted = all.filter((l) => l.contacted_at).length;
  const replied = all.filter((l) => l.replied_at).length;
  const out = all.filter((l) => OUT.includes(l.status));

  return (
    <>
      <header className="hub-head">
        <div>
          <span className="tag">Outreach_</span>
          <h1>Pipeline</h1>
        </div>
        <div className="row">
          <button className="btn" type="button" onClick={sync} disabled={syncing}>
            {syncing ? "Checking Gmail…" : "Check Gmail now"}
          </button>
          <Link className="btn primary" href="/adminhub/leads">Find leads</Link>
        </div>
      </header>

      {error && <p className="note bad" role="alert" style={{ marginBottom: 16 }}>{error}</p>}
      {report && (
        <p className="note ok" role="status" style={{ marginBottom: 16 }}>
          Gmail checked: {report.sent} sent, {report.replied} replied, {report.followups} follow-up drafts prepared,{" "}
          {report.cold} gone cold, {report.bounced} bounced.
          {report.errors.length > 0 && ` ${report.errors.length} could not be checked: ${report.errors.join("; ")}`}
        </p>
      )}

      <div className="hub-stats">
        <div><b>{by("new").length}</b><span className="tag dim">New leads</span></div>
        <div><b>{contacted}</b><span className="tag dim">Contacted</span></div>
        <div><b>{replied}</b><span className="tag dim">Replied</span></div>
        <div><b>{contacted ? Math.round((replied / contacted) * 100) : 0}%</b><span className="tag dim">Reply rate</span></div>
        <div><b>{by("closed").length}</b><span className="tag dim">Closed</span></div>
      </div>

      {leads === null && !error && <p className="muted">Loading pipeline…</p>}

      {leads !== null && (
        <div className="hub-board">
          {COLUMNS.map((col) => (
            <section className="hub-col" key={col.key} aria-label={col.label}>
              <header>
                <h3>{col.label}</h3>
                <span className="count">{by(col.key).length}</span>
              </header>
              {col.hint && <p className="small muted">{col.hint}</p>}
              {by(col.key).map((lead) => (
                <Card key={lead.id} lead={lead} onMove={move} />
              ))}
            </section>
          ))}
        </div>
      )}

      {out.length > 0 && (
        <details style={{ marginTop: 22 }}>
          <summary className="tag dim" style={{ cursor: "pointer" }}>
            Out of pipeline · {out.length}
          </summary>
          <table className="hub-table" style={{ marginTop: 10 }}>
            <thead>
              <tr><th>Lead</th><th>Email</th><th>Why</th><th></th></tr>
            </thead>
            <tbody>
              {out.map((l) => (
                <tr key={l.id}>
                  <td>{l.name}</td>
                  <td className="small muted">{l.email}</td>
                  <td><span className={`pill ${l.status === "bounced" ? "bad" : ""}`}>{l.status}</span></td>
                  <td style={{ textAlign: "right" }}>
                    <button className="btn sm quiet" type="button" onClick={() => move(l, "contacted")}>
                      Back to contacted
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </>
  );
}
