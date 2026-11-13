"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

const CURRENCIES = ["EUR", "CZK", "USD", "GBP"];

const cash = (n, currency) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: currency || "EUR", maximumFractionDigits: 2 }).format(n || 0);
const day = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const today = () => new Date().toISOString().slice(0, 10);

const emptyItem = () => ({ description: "", quantity: 1, price: "" });
const emptyInvoice = () => ({ number: "", issued: today(), due: "", currency: "EUR", link: "", items: [emptyItem()] });
const sum = (items) => items.reduce((total, i) => total + (Number(i.quantity) || 0) * (Number(i.price) || 0), 0);

// Invoices and their line items for one client, entered by hand. Admins only.
export default function Invoices({ clientId }) {
  const [invoices, setInvoices] = useState(null);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState("");
  const path = `/clients/${clientId}/invoices`;

  const load = useCallback(async () => {
    try {
      setInvoices((await api(path)).invoices);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, [path]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn) => {
    setError("");
    try {
      await fn();
      await load();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  };

  const setItem = (index, patch) =>
    setDraft({ ...draft, items: draft.items.map((item, i) => (i === index ? { ...item, ...patch } : item)) });

  async function save(e) {
    e.preventDefault();
    if (await run(() => api(path, { method: "POST", body: draft }))) setDraft(null);
  }

  const edit = (inv) =>
    setDraft({ id: inv.id, number: inv.number || "", issued: inv.issued, due: inv.due || "", currency: inv.currency, link: inv.link || "", items: inv.items });
  const remove = (inv) =>
    window.confirm(`Delete invoice ${inv.number || day(inv.issued)}? This cannot be undone.`) &&
    run(() => api(`${path}?id=${inv.id}`, { method: "DELETE" }));

  const open = (invoices || []).filter((i) => !i.paid);

  return (
    <section className="panel stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2>Invoices</h2>
        {!draft && <button className="btn primary" type="button" onClick={() => setDraft(emptyInvoice())}>Add invoice</button>}
      </div>
      <p className="muted">
        Only admins see this. Invoices count in Finance in the month they were issued, on top of the monthly retainer.
      </p>
      {error && <p className="note bad" role="alert">{error}</p>}

      {draft && (
        <form className="stack hub-inv-form" onSubmit={save}>
          <div className="hub-inv-head">
            <label className="lbl">
              Invoice number
              <input className="field" placeholder="Optional" value={draft.number} onChange={(e) => setDraft({ ...draft, number: e.target.value })} />
            </label>
            <label className="lbl">
              Issued
              <input className="field" type="date" required value={draft.issued} onChange={(e) => setDraft({ ...draft, issued: e.target.value })} />
            </label>
            <label className="lbl">
              Due
              <input className="field" type="date" value={draft.due} onChange={(e) => setDraft({ ...draft, due: e.target.value })} />
            </label>
            <label className="lbl">
              Currency
              <select className="field" value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value })}>
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
          </div>

          <div className="stack" style={{ gap: 8 }}>
            <span className="tag dim">Items</span>
            {draft.items.map((item, i) => (
              <div className="hub-inv-item" key={i}>
                <input className="field" required placeholder="e.g. 5 thumbnails" aria-label="Item description" value={item.description} onChange={(e) => setItem(i, { description: e.target.value })} />
                <input className="field" type="number" min="0" step="any" required placeholder="Qty" aria-label="Quantity" value={item.quantity} onChange={(e) => setItem(i, { quantity: e.target.value })} />
                <input className="field" type="number" step="any" required placeholder="Unit price" aria-label="Unit price" value={item.price} onChange={(e) => setItem(i, { price: e.target.value })} />
                <button
                  className="btn sm quiet danger"
                  type="button"
                  disabled={draft.items.length === 1}
                  onClick={() => setDraft({ ...draft, items: draft.items.filter((_, n) => n !== i) })}
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="row" style={{ justifyContent: "space-between" }}>
              <button className="btn sm" type="button" onClick={() => setDraft({ ...draft, items: [...draft.items, emptyItem()] })}>Add item</button>
              <span>Total <b>{cash(sum(draft.items), draft.currency)}</b></span>
            </div>
          </div>

          <label className="lbl">
            Link to the invoice file
            <input className="field" type="url" placeholder="Optional, e.g. a Google Drive link" value={draft.link} onChange={(e) => setDraft({ ...draft, link: e.target.value })} />
          </label>
          <div className="row">
            <button className="btn primary" type="submit">{draft.id ? "Save changes" : "Save invoice"}</button>
            <button className="btn quiet" type="button" onClick={() => setDraft(null)}>Cancel</button>
          </div>
        </form>
      )}

      {invoices === null && !error && <p className="muted">Loading invoices…</p>}
      {invoices?.length === 0 && !draft && <p className="muted">No invoices yet.</p>}
      {invoices?.length > 0 && (
        <>
          <div style={{ overflowX: "auto" }}>
            <table className="hub-table">
              <thead>
                <tr><th>Invoice</th><th>Items</th><th>Total</th><th>Status</th><th /></tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <b>{inv.number || "No number"}</b>
                      <div className="small muted">{day(inv.issued)}{inv.due ? ` · due ${day(inv.due)}` : ""}</div>
                      {inv.link && <a className="link small" href={inv.link} target="_blank" rel="noreferrer">Open file</a>}
                    </td>
                    <td>
                      {inv.items.map((item, i) => (
                        <div className="small" key={i}>
                          {item.description}
                          <span className="muted"> · {item.quantity} × {cash(item.price, inv.currency)}</span>
                        </div>
                      ))}
                    </td>
                    <td><b>{cash(inv.total, inv.currency)}</b></td>
                    <td>
                      <button
                        className={`btn sm ${inv.paid ? "primary" : ""}`}
                        type="button"
                        aria-pressed={inv.paid}
                        onClick={() => run(() => api(path, { method: "PUT", body: { id: inv.id, paid: !inv.paid } }))}
                      >
                        {inv.paid ? "Paid" : "Mark as paid"}
                      </button>
                    </td>
                    <td>
                      <div className="row" style={{ flexWrap: "nowrap", justifyContent: "flex-end" }}>
                        <button className="btn sm quiet" type="button" onClick={() => edit(inv)}>Edit</button>
                        <button className="btn sm quiet danger" type="button" onClick={() => remove(inv)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {open.length > 0 && (
            <p className="small muted">
              {open.length} unpaid:{" "}
              {Object.entries(open.reduce((t, i) => ({ ...t, [i.currency]: (t[i.currency] || 0) + i.total }), {}))
                .map(([currency, n]) => cash(n, currency))
                .join(" + ")}
            </p>
          )}
        </>
      )}
    </section>
  );
}
