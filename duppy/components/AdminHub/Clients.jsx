"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "./api";

export function Password({ value, email }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="note ok stack" role="status">
      <b>Portal login for the client. This password is shown only once.</b>
      <div className="row">
        <span className="small muted">Email</span> <code>{email}</code>
        <span className="small muted">Password</span> <code>{value}</code>
        <button
          className="btn sm"
          type="button"
          onClick={() =>
            navigator.clipboard
              .writeText(`https://www.dupscaled.com/portal\nEmail: ${email}\nPassword: ${value}`)
              .then(() => setCopied(true))
          }
        >
          {copied ? "Copied" : "Copy login"}
        </button>
      </div>
    </div>
  );
}

export default function Clients() {
  const [clients, setClients] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "" });
  const [created, setCreated] = useState(null);

  const load = useCallback(async () => {
    try {
      setClients((await api("/clients")).clients);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function add(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await api("/clients", { method: "POST", body: form });
      setCreated({ ...res, email: form.email.trim().toLowerCase() });
      setForm({ name: "", email: "" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <header className="hub-head hero" style={{ "--art": "url(/brand/bg-hero-clients.jpg)" }}>
        <div>
          <span className="tag">Clients_</span>
          <h1>Clients</h1>
          <p className="lede">Deliverables, weekly numbers and each client&apos;s own portal.</p>
        </div>
      </header>

      {error && <p className="note bad" role="alert" style={{ marginBottom: 16 }}>{error}</p>}
      {created && <div style={{ marginBottom: 16 }}><Password value={created.password} email={created.email} /></div>}

      {clients === null && !error && <p className="muted">Loading clients…</p>}
      {clients?.length === 0 && <p className="muted" style={{ marginBottom: 16 }}>No clients yet. Add the first one below.</p>}

      {clients?.length > 0 && (
        <div className="panel" style={{ padding: 8, marginBottom: 22 }}>
          <table className="hub-table">
            <thead>
              <tr><th>Client</th><th>Portal login</th><th>Status</th><th>Open deliverables</th><th>Last seen</th></tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td><Link className="link" href={`/adminhub/clients/${c.id}`}><b>{c.name}</b></Link></td>
                  <td className="small muted">{c.email}</td>
                  <td><span className={`pill ${c.status === "active" ? "ok" : c.status === "paused" ? "warn" : ""}`}>{c.status}</span></td>
                  <td>{c.open}</td>
                  <td className="small muted">{c.last_login_at ? new Date(c.last_login_at).toLocaleDateString("en-GB") : "Never signed in"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form className="panel stack" onSubmit={add} style={{ maxWidth: 760 }}>
        <h2>Add a client</h2>
        <div className="row" style={{ alignItems: "flex-end" }}>
          <label className="lbl grow">
            Name
            <input className="field" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="lbl grow">
            Their email (portal login)
            <input className="field" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <button className="btn primary" type="submit">Add client</button>
        </div>
        <p className="small muted">The hub creates a password for dupscaled.com/portal. You send it to the client yourself.</p>
      </form>
    </>
  );
}
