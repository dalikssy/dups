"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "./api";

const CURRENCIES = ["EUR", "CZK", "USD", "GBP"];
const COLORS = { EUR: "#8efc09", CZK: "#00fffc", USD: "#ff5fa2", GBP: "#ffc94d" };

const cash = (n, currency) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: currency || "EUR", maximumFractionDigits: 0 }).format(n || 0);
const monthName = (m) => new Date(`${m}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const shortDay = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
// New entries default to today, or to the 1st when another month is open.
const defaultDate = (month) => {
  const today = new Date().toISOString().slice(0, 10);
  return today.startsWith(month) ? today : `${month}-01`;
};
const emptyEntry = () => ({ name: "", amount: "", currency: "EUR", date: "", note: "", paid: false });
const shortMonth = (m) => new Date(`${m}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });

// Totals per currency, e.g. "€3,600 + 25 000 Kč". Currencies are never mixed.
function Sums({ totals }) {
  const parts = Object.entries(totals).filter(([, n]) => n > 0);
  if (!parts.length) return <b>–</b>;
  return (
    <b style={parts.length > 1 ? { fontSize: 22 } : undefined}>
      {parts.map(([currency, n]) => cash(n, currency)).join(" + ")}
    </b>
  );
}

function Row({ client, month, onChange }) {
  const [retainer, setRetainer] = useState(client.retainer ?? "");
  const [currency, setCurrency] = useState(client.currency || "EUR");
  const dirty = String(retainer) !== String(client.retainer ?? "") || currency !== client.currency;

  useEffect(() => {
    setRetainer(client.retainer ?? "");
    setCurrency(client.currency || "EUR");
  }, [client.retainer, client.currency]);

  return (
    <tr>
      <td>
        <Link className="link" href={`/adminhub/clients/${client.id}`}><b>{client.name}</b></Link>
        {client.status !== "active" && <span className="pill warn" style={{ marginLeft: 8 }}>{client.status}</span>}
      </td>
      <td>
        <div className="row" style={{ flexWrap: "nowrap" }}>
          <input className="field" style={{ width: 120 }} type="number" min="0" aria-label={`Retainer for ${client.name}`} placeholder="Not set" value={retainer} onChange={(e) => setRetainer(e.target.value)} />
          <select className="field" style={{ width: 92 }} aria-label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          {dirty && (
            <button className="btn sm primary" type="button" onClick={() => onChange(() => api("/finance", { method: "POST", body: { clientId: client.id, retainer, currency } }))}>
              Save
            </button>
          )}
        </div>
      </td>
      <td>{client.amount > 0 ? <b>{cash(client.amount, client.currency)}</b> : <span className="muted">–</span>}</td>
      <td>
        {client.amount > 0 ? (
          <button
            className={`btn sm ${client.paid ? "primary" : ""}`}
            type="button"
            aria-pressed={client.paid}
            onClick={() => onChange(() => api("/finance", { method: "PUT", body: { clientId: client.id, month, paid: !client.paid } }))}
          >
            {client.paid ? "Paid" : "Mark as paid"}
          </button>
        ) : (
          <span className="small muted">Set a retainer first</span>
        )}
      </td>
    </tr>
  );
}

export default function Finance() {
  const [data, setData] = useState(null);
  const [month, setMonth] = useState("");
  const [error, setError] = useState("");
  const [entry, setEntry] = useState(emptyEntry);

  const load = useCallback(async (m) => {
    try {
      const d = await api(`/finance${m ? `?month=${m}` : ""}`);
      setData(d);
      setMonth(d.month);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load("");
  }, [load]);

  const change = async (fn) => {
    try {
      await fn();
      await load(month);
    } catch (e) {
      setError(e.message);
    }
  };

  async function addEntry(e) {
    e.preventDefault();
    try {
      await api("/finance/entries", { method: "POST", body: { ...entry, date: entry.date || defaultDate(month) } });
      setEntry({ ...emptyEntry(), currency: entry.currency });
      await load(month);
    } catch (err) {
      setError(err.message);
    }
  }

  const step = (by) => {
    const d = new Date(`${month}-01T00:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() + by);
    load(d.toISOString().slice(0, 7));
  };

  const currencies = data ? [...new Set(data.history.map((h) => h.currency))] : [];
  const chart = data
    ? data.months.map((m) => ({ month: m, ...Object.fromEntries(data.history.filter((h) => h.month === m).map((h) => [h.currency, h.received])) }))
    : [];

  return (
    <>
      <header className="hub-head hero" style={{ "--art": "url(/brand/bg-hero-finance.jpg)" }}>
        <div>
          <span className="tag">Admin_</span>
          <h1>Finance</h1>
          <p className="lede">Retainers, other income, who has paid this month and what the agency takes in.</p>
        </div>
        {data && (
          <div className="row">
            <button className="btn sm" type="button" onClick={() => step(-1)} aria-label="Previous month">←</button>
            <b style={{ minWidth: 150, textAlign: "center" }}>{monthName(month)}</b>
            <button className="btn sm" type="button" onClick={() => step(1)} aria-label="Next month">→</button>
          </div>
        )}
      </header>

      {error && <p className="note bad" role="alert" style={{ marginBottom: 16 }}>{error}</p>}
      {!data && !error && <p className="muted">Loading finance…</p>}

      {data && (
        <div className="stack" style={{ gap: 18 }}>
          <div className="hub-tiles" style={{ marginBottom: 0 }}>
            <div className="glass hub-tile"><span className="tag dim">Expected</span><Sums totals={data.expected} /></div>
            <div className="glass hub-tile accent"><span className="tag">Received</span><Sums totals={data.received} /></div>
            <div className="glass hub-tile"><span className="tag dim">Outstanding</span><Sums totals={data.outstanding} /></div>
            <div className="glass hub-tile">
              <span className="tag dim">Paying clients</span>
              <b>{data.clients.filter((c) => c.paid).length}/{data.clients.filter((c) => c.amount > 0).length}</b>
            </div>
          </div>

          <section className="panel stack">
            <h2>Clients in {monthName(month)}</h2>
            {data.clients.length === 0 ? (
              <p className="muted">No clients yet. Add them under <Link className="link" href="/adminhub/clients">Clients</Link>, then set what each one pays.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="hub-table">
                  <thead>
                    <tr><th>Client</th><th>Monthly retainer</th><th>Due this month</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {data.clients.map((c) => <Row key={c.id} client={c} month={month} onChange={change} />)}
                  </tbody>
                </table>
              </div>
            )}
            <p className="small muted">A month keeps the amount it was recorded with, so changing a retainer does not rewrite earlier months.</p>
          </section>

          <section className="panel stack">
            <h2>Other income in {monthName(month)}</h2>
            <p className="muted">Anyone who pays you, client or not. Counted on top of the retainers.</p>
            <form className="hub-entry" onSubmit={addEntry}>
              <input className="field" required placeholder="Person or company" aria-label="Person or company" value={entry.name} onChange={(e) => setEntry({ ...entry, name: e.target.value })} />
              <input className="field" type="number" min="0" step="any" required placeholder="Amount" aria-label="Amount" value={entry.amount} onChange={(e) => setEntry({ ...entry, amount: e.target.value })} />
              <select className="field" aria-label="Currency" value={entry.currency} onChange={(e) => setEntry({ ...entry, currency: e.target.value })}>
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <input className="field" type="date" required aria-label="Date" value={entry.date || defaultDate(month)} onChange={(e) => setEntry({ ...entry, date: e.target.value })} />
              <input className="field" placeholder="Note (optional)" aria-label="Note" value={entry.note} onChange={(e) => setEntry({ ...entry, note: e.target.value })} />
              <label className="row small" style={{ flexWrap: "nowrap", gap: 6 }}>
                <input type="checkbox" checked={entry.paid} onChange={(e) => setEntry({ ...entry, paid: e.target.checked })} />
                Paid
              </label>
              <button className="btn primary" type="submit">Add</button>
            </form>
            {data.entries.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table className="hub-table">
                  <thead>
                    <tr><th>From</th><th>Date</th><th>Amount</th><th>Status</th><th /></tr>
                  </thead>
                  <tbody>
                    {data.entries.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <b>{item.name}</b>
                          {item.note && <div className="small muted">{item.note}</div>}
                        </td>
                        <td>{shortDay(item.date)}</td>
                        <td><b>{cash(item.amount, item.currency)}</b></td>
                        <td>
                          <button
                            className={`btn sm ${item.paid ? "primary" : ""}`}
                            type="button"
                            aria-pressed={item.paid}
                            onClick={() => change(() => api("/finance/entries", { method: "PUT", body: { id: item.id, paid: !item.paid } }))}
                          >
                            {item.paid ? "Paid" : "Mark as paid"}
                          </button>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            className="btn sm quiet danger"
                            type="button"
                            onClick={() => window.confirm(`Delete ${item.name}, ${cash(item.amount, item.currency)}? This cannot be undone.`) && change(() => api(`/finance/entries?id=${item.id}`, { method: "DELETE" }))}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <figure className="glass hub-chart">
            <figcaption className="row" style={{ justifyContent: "space-between" }}>
              <h3>Income received, last 6 months</h3>
              <span className="row" style={{ gap: 14 }}>
                {currencies.map((c) => <span key={c} className="legend"><i style={{ background: COLORS[c] }} />{c}</span>)}
              </span>
            </figcaption>
            {currencies.length === 0 ? (
              <p className="muted">Nothing marked as paid yet.</p>
            ) : (
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart} margin={{ top: 12, right: 16, bottom: 0, left: 0 }} barCategoryGap="28%">
                    <CartesianGrid stroke="#2c2c2c" vertical={false} />
                    <XAxis dataKey="month" tickFormatter={shortMonth} stroke="#a3a3a3" tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#2c2c2c" }} />
                    <YAxis stroke="#a3a3a3" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={56} />
                    <Tooltip
                      formatter={(value, key) => [cash(value, key), key]}
                      labelFormatter={monthName}
                      contentStyle={{ background: "#181818", border: "1px solid #333", borderRadius: 12, color: "#f7f7f7" }}
                      cursor={{ fill: "rgb(255 255 255 / 0.04)" }}
                    />
                    {currencies.map((c) => <Bar key={c} dataKey={c} fill={COLORS[c]} radius={[6, 6, 0, 0]} isAnimationActive={false} />)}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </figure>
        </div>
      )}
    </>
  );
}
