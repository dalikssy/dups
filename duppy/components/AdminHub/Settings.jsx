"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

export default function Settings({ me, gmailResult }) {
  const [team, setTeam] = useState(null);
  const [gmail, setGmail] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", name: "", role: "team" });

  const load = useCallback(async () => {
    try {
      const [t, g] = await Promise.all([api("/team"), api("/gmail")]);
      setTeam(t);
      setGmail(g);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function add(e) {
    e.preventDefault();
    try {
      await api("/team", { method: "POST", body: form });
      setForm({ email: "", name: "", role: "team" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(email) {
    if (!window.confirm(`Remove ${email}? They will lose access within a few minutes.`)) return;
    try {
      await api(`/team?email=${encodeURIComponent(email)}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function disconnect() {
    if (!window.confirm("Disconnect Gmail? Drafts and follow-ups stop until it is connected again.")) return;
    await api("/gmail", { method: "DELETE" });
    load();
  }

  return (
    <>
      <header className="hub-head">
        <div>
          <span className="tag">Admin_</span>
          <h1>Settings</h1>
        </div>
      </header>

      {error && <p className="note bad" role="alert" style={{ marginBottom: 16 }}>{error}</p>}
      {gmailResult && (
        <p className={`note ${gmailResult === "connected" ? "ok" : "bad"}`} role="status" style={{ marginBottom: 16 }}>
          {gmailResult === "connected" ? "Gmail connected." : gmailResult}
        </p>
      )}

      <div className="stack" style={{ gap: 18, maxWidth: 860 }}>
        <section className="panel stack">
          <h2>Gmail</h2>
          <p className="muted">
            The hub puts drafts into {gmail?.sender || "the agency mailbox"} and reads the mailbox to see what was sent
            and who replied. It never sends email.
          </p>
          {gmail?.connection ? (
            <div className="row">
              <span className="pill ok">Connected</span>
              <span>{gmail.connection.email}</span>
              <button className="btn sm quiet danger" type="button" onClick={disconnect}>Disconnect</button>
            </div>
          ) : (
            <div className="row">
              <a className="btn primary" href="/api/adminhub/gmail/connect">Connect {gmail?.sender || "Gmail"}</a>
              <span className="small muted">Sign in as that mailbox when Google asks.</span>
            </div>
          )}
        </section>

        <section className="panel stack">
          <h2>Team</h2>
          <p className="muted">
            Only these Google accounts can sign in. Team members see outreach; admins also see settings.
          </p>
          <table className="hub-table">
            <thead>
              <tr><th>Email</th><th>Name</th><th>Role</th><th></th></tr>
            </thead>
            <tbody>
              {(team?.envAdmins || []).map((email) => (
                <tr key={email}>
                  <td>{email}</td>
                  <td className="muted">Owner</td>
                  <td><span className="pill ok">admin</span></td>
                  <td></td>
                </tr>
              ))}
              {(team?.users || [])
                .filter((u) => !(team.envAdmins || []).includes(u.email))
                .map((u) => (
                  <tr key={u.email}>
                    <td>{u.email}</td>
                    <td className="muted">{u.name || ""}</td>
                    <td><span className={`pill ${u.role === "admin" ? "ok" : ""}`}>{u.role}</span></td>
                    <td style={{ textAlign: "right" }}>
                      {u.email !== me && (
                        <button className="btn sm quiet danger" type="button" onClick={() => remove(u.email)}>Remove</button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          <form className="row" onSubmit={add} style={{ alignItems: "flex-end" }}>
            <label className="lbl grow">
              Google email
              <input className="field" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            <label className="lbl grow">
              Name
              <input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label className="lbl" style={{ width: 120 }}>
              Role
              <select className="field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="team">Team</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <button className="btn" type="submit">Add</button>
          </form>
        </section>
      </div>
    </>
  );
}
