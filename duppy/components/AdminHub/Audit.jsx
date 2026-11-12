"use client";
import { useState } from "react";

// Audit controls for one lead: build it (research takes a few minutes),
// open it, and see whether the lead has looked at it.
export default function Audit({ lead, onChange, compact = false }) {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const audit = lead.audit;
  const running = Boolean(status);

  async function build() {
    setError("");
    setStatus("Starting research…");
    try {
      const res = await fetch("/api/adminhub/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      });
      if (!res.ok || !res.body) throw new Error((await res.json().catch(() => ({}))).error || "The audit could not start.");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line);
          if (event.type === "status") setStatus(event.text);
          if (event.type === "error") setError(event.error);
        }
      }
    } catch (e) {
      setError(e.message);
    }
    setStatus("");
    onChange?.();
  }

  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="row">
        {audit && (
          <a className={`btn ${compact ? "sm" : ""}`} href={`/a/${audit.slug}`} target="_blank" rel="noreferrer">
            View audit
          </a>
        )}
        <button className={`btn ${compact ? "sm" : ""} ${audit ? "quiet" : ""}`} type="button" disabled={running} onClick={build}>
          {running ? "Researching…" : audit ? "Redo audit" : "Create audit"}
        </button>
        {audit &&
          (audit.views > 0 ? (
            <span className="pill ok">Opened {audit.views}×</span>
          ) : (
            <span className="pill">Not opened yet</span>
          ))}
      </div>
      {running && <p className="small muted" role="status" style={{ overflowWrap: "anywhere" }}>{status}</p>}
      {error && <p className="small" role="alert" style={{ color: "var(--danger)" }}>{error}</p>}
    </div>
  );
}
