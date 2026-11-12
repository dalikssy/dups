"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";
import Audit from "./Audit";

/* ------------------------------------------------------------ finder */

function Finder({ onLead }) {
  const [form, setForm] = useState({ segment: "", market: "", count: 5, notes: "" });
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState([]);
  const box = useRef(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  // the same search is sometimes reported twice in a row; show it once
  const say = (cls, text) => setLog((l) => (l[l.length - 1]?.text === text ? l : [...l, { cls, text }]));

  useEffect(() => {
    if (box.current) box.current.scrollTop = box.current.scrollHeight;
  }, [log]);

  function handle(event) {
    if (event.type === "status") say("", event.text);
    if (event.type === "lead") {
      say("hit", `Saved ${event.lead.name} <${event.lead.email}>${event.lead.email_verified ? "" : " (needs a manual check)"}`);
      onLead();
    }
    if (event.type === "skipped") say("miss", `Skipped ${event.name}: ${event.reason}`);
    if (event.type === "error") say("miss", event.error);
    if (event.type === "done") {
      say("hit", event.finished ? `Done. ${event.saved} saved.` : `Time limit reached with ${event.saved} saved. Run it again to continue.`);
    }
  }

  async function run(e) {
    e.preventDefault();
    setRunning(true);
    setLog([{ cls: "", text: "Starting research…" }]);
    try {
      const res = await fetch("/api/adminhub/leads/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok || !res.body) throw new Error((await res.json().catch(() => ({}))).error || "The search could not start.");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) if (line.trim()) handle(JSON.parse(line));
      }
    } catch (err) {
      say("miss", err.message);
    }
    setRunning(false);
    onLead();
  }

  return (
    <div className="hub-finder">
      <form className="panel stack" onSubmit={run}>
        <h2>Find leads</h2>
        <label className="lbl">
          Segment
          <textarea
            className="field"
            rows={3}
            required
            value={form.segment}
            onChange={set("segment")}
            placeholder="e.g. Valorant streamers with 100K–1M followers who post long VODs but few Shorts"
          />
        </label>
        <div className="row">
          <label className="lbl grow">
            Market
            <input className="field" value={form.market} onChange={set("market")} placeholder="US, UK, DE, Czech Republic…" />
          </label>
          <label className="lbl" style={{ width: 110 }}>
            How many
            <select className="field" value={form.count} onChange={set("count")}>
              {[3, 5, 8, 10].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        </div>
        <label className="lbl">
          Notes (optional)
          <input className="field" value={form.notes} onChange={set("notes")} placeholder="Anything to prefer or avoid" />
        </label>
        <div className="row">
          <button className="btn primary" type="submit" disabled={running}>
            {running ? "Researching…" : "Find leads"}
          </button>
          <span className="small muted">Takes a few minutes. Emails come only from official pages.</span>
        </div>
      </form>

      <div className="panel stack">
        <span className="tag blue">Research_log</span>
        <div className="hub-log" ref={box} aria-live="polite">
          {log.length === 0 && <p>Nothing running. Results will show up here and in the list below.</p>}
          {log.map((l, i) => <p key={i} className={l.cls}>{l.text}</p>)}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- lead card */

function Lead({ lead, gmailReady, reload, flash }) {
  const draft = lead.drafts.find((d) => d.kind === "initial");
  const [subject, setSubject] = useState(draft?.subject || "");
  const [body, setBody] = useState(draft?.body || "");
  const [busy, setBusy] = useState("");
  const dirty = draft && (subject !== draft.subject || body !== draft.body);

  useEffect(() => {
    setSubject(draft?.subject || "");
    setBody(draft?.body || "");
  }, [draft?.subject, draft?.body]);

  async function act(label, fn) {
    setBusy(label);
    try {
      await fn();
      await reload();
    } catch (e) {
      flash(`${lead.name}: ${e.message}`);
    }
    setBusy("");
  }

  const write = () => act("write", () => api("/drafts", { method: "POST", body: { leadId: lead.id } }));
  const save = () => api(`/drafts/${draft.id}`, { method: "PATCH", body: { subject, body } });
  const push = () =>
    act("push", async () => {
      if (dirty) await save();
      await api(`/drafts/${draft.id}/push`, { method: "POST" });
    });
  const patch = (body) => act("patch", () => api(`/leads/${lead.id}`, { method: "PATCH", body }));
  const remove = () => {
    if (window.confirm(`Delete ${lead.name} from the hub?`)) act("delete", () => api(`/leads/${lead.id}`, { method: "DELETE" }));
  };

  return (
    <article className="panel hub-lead">
      <header>
        <div className="who">
          <b>{lead.name}</b>
          <span className="small muted">{lead.email}</span>
          <div className="row">
            {lead.email_verified ? (
              <span className="pill ok">Email verified</span>
            ) : (
              <span className="pill warn">Check email by hand</span>
            )}
            {lead.category && <span className="pill">{lead.category.replace(/_/g, " ")}</span>}
            <span className="pill info">{lead.language === "cs" ? "Czech" : "English"}</span>
            {lead.email_source_url && (
              <a className="link small" href={lead.email_source_url} target="_blank" rel="noreferrer">Email source</a>
            )}
            {lead.website && (
              <a className="link small" href={lead.website} target="_blank" rel="noreferrer">Site</a>
            )}
          </div>
        </div>
        <div className="row">
          {!lead.email_verified && (
            <button className="btn sm" type="button" disabled={!!busy} onClick={() => patch({ email_verified: true })}>
              I checked it, it&apos;s right
            </button>
          )}
          <button
            className="btn sm quiet"
            type="button"
            disabled={!!busy}
            onClick={() => patch({ language: lead.language === "cs" ? "en" : "cs" })}
          >
            Switch to {lead.language === "cs" ? "English" : "Czech"}
          </button>
          <button className="btn sm quiet danger" type="button" disabled={!!busy} onClick={remove}>Delete</button>
        </div>
      </header>

      {lead.hook && <p className="small muted">{lead.hook}</p>}

      <Audit lead={lead} onChange={reload} />
      {lead.audit && draft && !draft.body.includes(lead.audit.slug) && (
        <p className="small muted">This draft was written before the audit. Rewrite it to include the audit link.</p>
      )}

      {draft ? (
        <div className="stack">
          <label className="lbl">
            Subject
            <input className="field" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </label>
          <label className="lbl">
            Email
            <textarea className="field" rows={11} value={body} onChange={(e) => setBody(e.target.value)} />
          </label>
          <div className="row">
            <button className="btn primary" type="button" disabled={!!busy || !gmailReady} onClick={push}>
              {busy === "push" ? "Adding…" : "Add to Gmail drafts"}
            </button>
            {dirty && (
              <button className="btn" type="button" disabled={!!busy} onClick={() => act("save", save)}>
                Save edits
              </button>
            )}
            <button className="btn quiet" type="button" disabled={!!busy} onClick={write}>
              {busy === "write" ? "Rewriting…" : "Rewrite"}
            </button>
            {!gmailReady && <span className="small muted">Gmail is not connected yet.</span>}
          </div>
        </div>
      ) : (
        <div className="row">
          <button className="btn primary" type="button" disabled={!!busy || !lead.email_verified} onClick={write}>
            {busy === "write" ? "Writing…" : "Write draft"}
          </button>
          {!lead.email_verified && <span className="small muted">Confirm the email first.</span>}
        </div>
      )}
    </article>
  );
}

/* -------------------------------------------------------------- page */

export default function Leads() {
  const [leads, setLeads] = useState(null);
  const [gmail, setGmail] = useState(null);
  const [message, setMessage] = useState("");
  const [bulk, setBulk] = useState("");
  const [manual, setManual] = useState({ name: "", email: "", language: "en", hook: "" });

  const reload = useCallback(async () => {
    try {
      setLeads((await api("/leads")).leads.filter((l) => l.status === "new"));
    } catch (e) {
      setMessage(e.message);
    }
  }, []);

  useEffect(() => {
    reload();
    api("/gmail").then(setGmail).catch(() => setGmail({ connection: null }));
  }, [reload]);

  const gmailReady = Boolean(gmail?.connection);
  const list = leads || [];
  const needDraft = list.filter((l) => l.email_verified && !l.drafts.length);
  const needPush = list.filter((l) => l.drafts.some((d) => d.kind === "initial" && d.status === "local"));

  // One request per lead, so a slow draft never times out the whole batch.
  async function writeAll() {
    let failed = 0;
    for (let i = 0; i < needDraft.length; i++) {
      setBulk(`Writing ${i + 1} of ${needDraft.length}…`);
      try {
        await api("/drafts", { method: "POST", body: { leadId: needDraft[i].id } });
      } catch {
        failed++;
      }
      await reload();
    }
    setBulk("");
    if (failed) setMessage(`${failed} draft${failed > 1 ? "s" : ""} could not be written. Try those again.`);
  }

  async function pushAll() {
    let failed = 0;
    for (let i = 0; i < needPush.length; i++) {
      setBulk(`Adding ${i + 1} of ${needPush.length} to Gmail…`);
      try {
        await api(`/drafts/${needPush[i].drafts.find((d) => d.kind === "initial").id}/push`, { method: "POST" });
      } catch {
        failed++;
      }
    }
    await reload();
    setBulk("");
    setMessage(
      failed
        ? `${failed} draft${failed > 1 ? "s" : ""} did not reach Gmail. Try those again.`
        : "Drafts are in Gmail. Review and send them from info@dupscaled.com.",
    );
  }

  async function addManual(e) {
    e.preventDefault();
    try {
      await api("/leads", { method: "POST", body: manual });
      setManual({ name: "", email: "", language: "en", hook: "" });
      setMessage("");
      reload();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <>
      <header className="hub-head hero" style={{ "--art": "url(/brand/bg-hero-leads.jpg)" }}>
        <div>
          <span className="tag">Outreach_</span>
          <h1>Lead finder</h1>
          <p className="lede">Find targets with verified emails, write the first email, add an audit.</p>
        </div>
      </header>

      <Finder onLead={reload} />

      <header className="hub-head" style={{ marginTop: 36 }}>
        <div>
          <span className="tag blue">Ready_to_draft</span>
          <h2>New leads · {list.length}</h2>
        </div>
        <div className="row">
          {bulk && <span className="small muted" role="status">{bulk}</span>}
          <button className="btn" type="button" disabled={!!bulk || !needDraft.length} onClick={writeAll}>
            Write all drafts ({needDraft.length})
          </button>
          <button className="btn primary" type="button" disabled={!!bulk || !needPush.length || !gmailReady} onClick={pushAll}>
            Add all to Gmail ({needPush.length})
          </button>
        </div>
      </header>

      {message && <p className="note" role="status" style={{ marginBottom: 16 }}>{message}</p>}
      {gmail && !gmailReady && (
        <p className="note bad" style={{ marginBottom: 16 }}>
          Gmail is not connected, so drafts stay in the hub. An admin can connect {gmail.sender || "the mailbox"} in Settings.
        </p>
      )}

      <div className="stack">
        {leads === null && <p className="muted">Loading leads…</p>}
        {leads !== null && list.length === 0 && (
          <p className="muted">No new leads. Run a search above, or add one by hand below.</p>
        )}
        {list.map((lead) => (
          <Lead key={lead.id} lead={lead} gmailReady={gmailReady} reload={reload} flash={setMessage} />
        ))}
      </div>

      <details style={{ marginTop: 28 }}>
        <summary className="tag dim" style={{ cursor: "pointer" }}>Add a lead by hand</summary>
        <form className="panel stack" style={{ marginTop: 12 }} onSubmit={addManual}>
          <div className="row">
            <label className="lbl grow">
              Name
              <input className="field" required value={manual.name} onChange={(e) => setManual({ ...manual, name: e.target.value })} />
            </label>
            <label className="lbl grow">
              Email
              <input className="field" type="email" required value={manual.email} onChange={(e) => setManual({ ...manual, email: e.target.value })} />
            </label>
            <label className="lbl" style={{ width: 130 }}>
              Language
              <select className="field" value={manual.language} onChange={(e) => setManual({ ...manual, language: e.target.value })}>
                <option value="en">English</option>
                <option value="cs">Czech</option>
              </select>
            </label>
          </div>
          <label className="lbl">
            What to open the email with
            <textarea
              className="field"
              rows={2}
              value={manual.hook}
              onChange={(e) => setManual({ ...manual, hook: e.target.value })}
              placeholder="A specific video, series, result or number from their content"
            />
          </label>
          <div><button className="btn" type="submit">Add lead</button></div>
        </form>
      </details>
    </>
  );
}
