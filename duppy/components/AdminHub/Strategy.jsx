"use client";
import { useEffect, useState } from "react";
import { api } from "./api";

const AREA = {
  subject: "Subject line",
  email: "Email",
  audit: "Audit",
  targeting: "Targeting",
  timing: "Timing",
  follow_up: "Follow-up",
  volume: "Volume",
};

const pct = (n) => (n == null ? "–" : `${n}%`);

function Numbers({ week, before }) {
  return (
    <div className="hub-tiles" style={{ marginBottom: 0 }}>
      <div className="glass hub-tile"><span className="tag dim">Sent, 7 days</span><b>{week.sent}</b></div>
      <div className="glass hub-tile">
        <span className="tag dim">Reply rate</span>
        <b>{pct(week.reply_rate_pct)}</b>
        <span className="small muted">{pct(before.reply_rate_pct)} in the 4 weeks before</span>
      </div>
      <div className="glass hub-tile">
        <span className="tag dim">With audit</span>
        <b>{pct(week.with_audit.reply_rate_pct)}</b>
        <span className="small muted">{week.with_audit.sent} sent · {pct(week.without_audit.reply_rate_pct)} without</span>
      </div>
      <div className="glass hub-tile">
        <span className="tag dim">Audits opened</span>
        <b>{week.audits_opened}/{week.audits_sent}</b>
      </div>
      <div className="glass hub-tile"><span className="tag dim">Bounced</span><b>{week.bounced}</b></div>
    </div>
  );
}

// "Optimize strategy": reviews last week's outreach and proposes changes.
// Applying the guidance makes every new draft follow it.
// trigger: a counter owned by the page; each increase starts a new review.
export default function Strategy({ trigger }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [active, setActive] = useState(null);
  const [guidance, setGuidance] = useState("");

  useEffect(() => {
    api("/strategy").then((r) => setActive(r.active)).catch(() => {});
  }, []);

  async function run() {
    setOpen(true);
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const r = await api("/strategy", { method: "POST" });
      setResult(r);
      setGuidance(r.advice.guidance);
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  }

  async function apply() {
    try {
      setActive((await api("/strategy", { method: "PUT", body: { guidance } })).active);
    } catch (e) {
      setError(e.message);
    }
  }

  async function clear() {
    if (!window.confirm("Stop applying this guidance to new drafts?")) return;
    setActive((await api("/strategy", { method: "DELETE" })).active);
  }

  useEffect(() => {
    if (trigger > 0) run();
    // run is recreated on every render; only a new trigger should start it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  const advice = result?.advice;

  return (
    <>
      {(open || active) && (
        <section className="panel stack hub-strategy" aria-live="polite">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="stack" style={{ gap: 6 }}>
              <span className="tag blue">Strategy_</span>
              <h2>{advice ? "What to change" : "Outreach strategy"}</h2>
            </div>
            {open && <button className="btn sm quiet" type="button" onClick={() => setOpen(false)}>Close</button>}
          </div>

          {busy && <p className="muted">Reading last week&apos;s emails and results. This takes about half a minute.</p>}
          {error && <p className="note bad" role="alert">{error}</p>}

          {open && advice && (
            <>
              <Numbers week={result.numbers.last_week} before={result.numbers.previous_four_weeks} />
              <p style={{ fontSize: 17, maxWidth: "70ch" }}>{advice.summary}</p>
              {advice.confidence !== "high" && (
                <p className="note">
                  {advice.confidence === "low"
                    ? "There is not much data behind this yet, so treat it as a read of the emails, not as proof."
                    : "The sample is still small. Good enough to try, too early to be sure."}
                </p>
              )}

              {advice.findings.length > 0 && (
                <div className="stack">
                  <h3>What the week shows</h3>
                  {advice.findings.map((f, i) => (
                    <div key={i}>
                      <b>{f.title}</b>
                      <p className="muted">{f.detail}</p>
                    </div>
                  ))}
                </div>
              )}

              {advice.changes.length > 0 && (
                <div className="stack">
                  <h3>Proposed changes</h3>
                  {advice.changes.map((c, i) => (
                    <div className="hub-change" key={i}>
                      <span className="pill info">{AREA[c.area] || c.area}</span>
                      <div>
                        <b>{c.change}</b>
                        <p className="muted">{c.why}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <label className="lbl">
                Guidance for new drafts (edit it if you disagree)
                <textarea className="field" rows={6} value={guidance} onChange={(e) => setGuidance(e.target.value)} />
              </label>
              <div className="row">
                <button className="btn primary" type="button" onClick={apply} disabled={!guidance.trim()}>
                  Use for new drafts
                </button>
                <span className="small muted">Changes to subject lines and emails apply from the next draft. Targeting and timing are for you.</span>
              </div>
            </>
          )}

          {active && (
            <div className="note ok stack">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <b>Applied to new drafts since {new Date(active.saved_at).toLocaleDateString("en-GB")}</b>
                <button className="btn sm quiet danger" type="button" onClick={clear}>Stop using</button>
              </div>
              <p style={{ whiteSpace: "pre-wrap" }}>{active.guidance}</p>
            </div>
          )}
        </section>
      )}
    </>
  );
}
