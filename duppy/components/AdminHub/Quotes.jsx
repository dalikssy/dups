"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

const TIER = { small: "Small budget", mid: "Mid budget", large: "Large budget", enterprise: "Enterprise budget" };

function useMoney(currency) {
  return (n) =>
    new Intl.NumberFormat("en-GB", { style: "currency", currency: currency || "EUR", maximumFractionDigits: 0 }).format(n || 0);
}

/* -------------------------------------------------------------- result */

function Quote({ quote, onDelete }) {
  const d = quote.data;
  const cash = useMoney(d.currency);
  return (
    <article className="panel stack hub-quote">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div className="stack" style={{ gap: 6 }}>
          <span className="tag blue">Estimate · {new Date(quote.created_at).toLocaleDateString("en-GB")}</span>
          <h2>{quote.client}</h2>
          <a className="link small" href={quote.url} target="_blank" rel="noreferrer">{quote.url}</a>
        </div>
        <button className="btn sm quiet danger" type="button" onClick={() => onDelete(quote)}>Delete</button>
      </div>

      <div className="hub-tiles" style={{ marginBottom: 0 }}>
        {d.monthly_total > 0 && (
          <div className="glass hub-tile accent"><span className="tag">Per month</span><b>{cash(d.monthly_total)}</b></div>
        )}
        {d.one_off_total > 0 && (
          <div className={`glass hub-tile ${d.monthly_total > 0 ? "" : "accent"}`}>
            <span className={`tag ${d.monthly_total > 0 ? "dim" : ""}`}>One-off</span><b>{cash(d.one_off_total)}</b>
          </div>
        )}
        <div className="glass hub-tile">
          <span className="tag dim">Room to move</span>
          <b style={{ fontSize: 22 }}>{cash(d.floor_total)} – {cash(d.ceiling_total)}</b>
          <span className="small muted">List price {cash(d.list_total)}</span>
        </div>
        <div className="glass hub-tile">
          <span className="tag dim">Their budget</span>
          <b style={{ fontSize: 22 }}>{TIER[d.budget_tier] || d.budget_tier}</b>
          <span className="small muted">Confidence: {d.confidence}</span>
        </div>
      </div>

      <table className="hub-table">
        <thead>
          <tr><th>Service</th><th>Qty</th><th>Price</th><th>Amount</th><th>Why</th></tr>
        </thead>
        <tbody>
          {d.lines.map((l) => (
            <tr key={l.key}>
              <td><b>{l.name}</b></td>
              <td>{l.unit === "month" ? "per month" : `${l.qty} × piece`}</td>
              <td>
                {cash(l.price)}
                <div className="small muted">{cash(l.min)} – {cash(l.max)}</div>
              </td>
              <td><b>{cash(l.amount)}</b></td>
              <td className="small muted" style={{ maxWidth: 380 }}>{l.why}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="hub-quote-notes">
        <div>
          <h3>Reach</h3>
          <p className="muted">{d.reach_summary}</p>
          <ul className="small muted">
            {d.reach.map((r, i) => (
              <li key={i}><b style={{ color: "var(--white)" }}>{r.platform}</b>{r.audience ? ` · ${r.audience}` : ""}{r.note ? ` · ${r.note}` : ""}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Estimated budget</h3>
          <p className="muted">{d.budget_estimate}</p>
        </div>
        <div>
          <h3>How to open</h3>
          <p className="muted">{d.opening_note}</p>
        </div>
        <div>
          <h3>Where to stop</h3>
          <p className="muted">{d.floor_note}</p>
        </div>
      </div>
      {d.confidence === "low" && (
        <p className="note">Little could be confirmed about this client, so treat the budget as a guess and lean on your own read.</p>
      )}
    </article>
  );
}

/* ---------------------------------------------------------- price list */

function PriceList({ pricing, onSaved }) {
  const [draft, setDraft] = useState(pricing);
  const [message, setMessage] = useState("");
  useEffect(() => setDraft(pricing), [pricing]);

  const change = (i, field) => (e) =>
    setDraft((p) => ({ ...p, services: p.services.map((s, j) => (j === i ? { ...s, [field]: e.target.value } : s)) }));
  const remove = (i) => setDraft((p) => ({ ...p, services: p.services.filter((_, j) => j !== i) }));
  const add = () => setDraft((p) => ({ ...p, services: [...p.services, { key: "", name: "", unit: "piece", min: "", base: "", max: "" }] }));

  async function save(e) {
    e.preventDefault();
    try {
      const res = await api("/quotes", { method: "PUT", body: draft });
      onSaved(res.pricing);
      setMessage("Price list saved.");
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <details className="panel">
      <summary style={{ cursor: "pointer" }}><b>Price list</b> <span className="small muted">· the usual price and the range an estimate may move in</span></summary>
      <form className="stack" style={{ marginTop: 18 }} onSubmit={save}>
        <div className="hub-pricelist head small muted">
          <span>Service</span><span>Billed</span><span>Lowest</span><span>Usual</span><span>Highest</span><span />
        </div>
        {draft.services.map((s, i) => (
          <div className="hub-pricelist" key={i}>
            <input className="field" aria-label="Service" required value={s.name} onChange={change(i, "name")} />
            <select className="field" aria-label="Billed" value={s.unit} onChange={change(i, "unit")}>
              <option value="month">per month</option>
              <option value="piece">per piece</option>
            </select>
            <input className="field" aria-label="Lowest price" type="number" min="0" value={s.min} onChange={change(i, "min")} />
            <input className="field" aria-label="Usual price" type="number" min="0" required value={s.base} onChange={change(i, "base")} />
            <input className="field" aria-label="Highest price" type="number" min="0" value={s.max} onChange={change(i, "max")} />
            <button className="btn sm quiet danger" type="button" onClick={() => remove(i)}>Remove</button>
          </div>
        ))}
        <div className="row">
          <button className="btn sm" type="button" onClick={add}>Add service</button>
          <label className="lbl" style={{ width: 120 }}>
            Currency
            <select className="field" value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value })}>
              {["EUR", "CZK", "USD", "GBP"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <button className="btn primary" type="submit">Save price list</button>
          {message && <span className="small muted" role="status">{message}</span>}
        </div>
      </form>
    </details>
  );
}

/* ---------------------------------------------------------------- page */

export default function Quotes() {
  const [pricing, setPricing] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [qty, setQty] = useState({}); // service key -> quantity; absent = not wanted
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api("/quotes");
      setPricing(res.pricing);
      setQuotes(res.quotes);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (key) => setQty((q) => (key in q ? Object.fromEntries(Object.entries(q).filter(([k]) => k !== key)) : { ...q, [key]: 1 }));

  async function run(e) {
    e.preventDefault();
    setError("");
    setStatus("Looking at the client…");
    try {
      const res = await fetch("/api/adminhub/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, notes, services: Object.entries(qty).map(([key, n]) => ({ key, qty: n })) }),
      });
      if (!res.ok || !res.body) throw new Error((await res.json().catch(() => ({}))).error || "The estimate could not start.");
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
          if (event.type === "done") setQuotes((all) => [event.quote, ...all]);
        }
      }
    } catch (err) {
      setError(err.message);
    }
    setStatus("");
  }

  async function remove(quote) {
    if (!window.confirm(`Delete the estimate for ${quote.client}?`)) return;
    await api(`/quotes?id=${quote.id}`, { method: "DELETE" });
    setQuotes((all) => all.filter((q) => q.id !== quote.id));
  }

  const running = Boolean(status);
  const chosen = Object.keys(qty).length;

  return (
    <>
      <header className="hub-head hero" style={{ "--art": "url(/brand/bg-hero-pricing.jpg)" }}>
        <div>
          <span className="tag">Admin_</span>
          <h1>Pricing</h1>
          <p className="lede">Paste a client, pick what they want, get a price that fits their size.</p>
        </div>
      </header>

      {error && <p className="note bad" role="alert" style={{ marginBottom: 16 }}>{error}</p>}
      {!pricing && !error && <p className="muted">Loading price list…</p>}

      {pricing && (
        <div className="stack" style={{ gap: 18 }}>
          <form className="panel stack" onSubmit={run}>
            <h2>New estimate</h2>
            <label className="lbl">
              Client link
              <input className="field" type="url" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.youtube.com/@channel or their website" />
            </label>
            <div className="lbl">
              Services they want
              <div className="stack" style={{ gap: 8 }}>
                {pricing.services.map((s) => (
                  <div className="hub-service" key={s.key}>
                    <button type="button" className={`chip${s.key in qty ? " on" : ""}`} aria-pressed={s.key in qty} onClick={() => toggle(s.key)}>
                      {s.name}
                    </button>
                    {s.key in qty && s.unit !== "month" && (
                      <label className="row small muted" style={{ gap: 8 }}>
                        <input
                          className="field"
                          style={{ width: 84 }}
                          type="number"
                          min="1"
                          aria-label={`${s.name} quantity`}
                          value={qty[s.key]}
                          onChange={(e) => setQty({ ...qty, [s.key]: Math.max(1, Number(e.target.value) || 1) })}
                        />
                        piece(s)
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <label className="lbl">
              Notes (optional)
              <input className="field" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything you already know: their budget hints, urgency, who referred them" />
            </label>
            <div className="row">
              <button className="btn primary" type="submit" disabled={running || !chosen}>
                {running ? "Estimating…" : "Estimate price"}
              </button>
              {running ? <span className="small muted" role="status" style={{ overflowWrap: "anywhere" }}>{status}</span> : <span className="small muted">Takes about a minute.</span>}
            </div>
          </form>

          {quotes.map((q) => <Quote key={q.id} quote={q} onDelete={remove} />)}

          <PriceList pricing={pricing} onSaved={setPricing} />
        </div>
      )}
    </>
  );
}
