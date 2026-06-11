"use client";
import { useState, useEffect, useCallback } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Image from "next/image";

/* ============ storage helpers — server KV ============ */
const sget = async (key) => {
  try {
    const r = await fetch("/api/storage?key=" + encodeURIComponent(key));
    return r.ok ? await r.json() : null;
  } catch { return null; }
};
const sset = async (key, val) => {
  try {
    const r = await fetch("/api/storage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, value: val }) });
    return r.ok;
  } catch { return false; }
};
const sdel = async (key) => {
  try { await fetch("/api/storage?key=" + encodeURIComponent(key), { method: "DELETE" }); } catch {}
};

const genCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let c = "";
  for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
};

const STAGES = ["Lead", "Call booked", "Proposal sent", "Active", "Paused", "Churned"];
const DSTATUS = ["Brief", "In production", "In review", "Delivered"];
const DSTATUS_COLOR = { "Brief": "#8c988f", "In production": "#ffc94d", "In review": "#6db4ff", "Delivered": "#2bff87" };

const PLATFORMS = [
  { key: "tiktok", label: "TikTok", color: "#5ce1e6" },
  { key: "instagram", label: "Instagram", color: "#ff5fa2" },
  { key: "youtube", label: "YouTube", color: "#ff4d4d" },
];
const fmtN = (n) => {
  if (n == null) return "—";
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(n % 1e6 ? 1 : 0) + "M";
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(n % 1e3 ? 1 : 0) + "K";
  return String(n);
};

const emptyOnboarding = {
  contactName: "", email: "", company: "", goals: "", audience: "", competitors: "",
  colors: "", fonts: "", logoLink: "", assetsLink: "", styleNotes: "",
  socials: [{ platform: "Instagram", handle: "", access: "" }],
  notes: "",
};

export default function App() {
  const [view, setView] = useState("login");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [code, setCode] = useState("");
  const [me, setMe] = useState(null);
  const [settings, setSettings] = useState(null);

  const login = async () => {
    const c = code.trim().toUpperCase();
    if (!c) return;
    setLoading(true); setErr("");
    let st = await sget("settings");
    if (!st) { st = { adminPin: "DUPSCALED" }; await sset("settings", st); }
    setSettings(st);
    if (c === st.adminPin.toUpperCase()) { setView("admin"); setLoading(false); return; }
    const cl = await sget("client:" + c);
    if (cl) { setMe(cl); setView("client"); }
    else setErr("Code not found. Double-check it or contact Dalibor.");
    setLoading(false);
  };

  return (
    <div className="app">
      <Style />
      {view === "login" && (
        <div className="login-wrap">
          <div className="login-card">
            <div className="logo-wrap">
              <Image src="/logo.png" width={160} height={19} alt="DUPSCALED" style={{ filter: "invert(1) brightness(10)" }} />
            </div>
            <p className="login-sub">CLIENT PORTAL</p>
            <label className="flabel">Access code</label>
            <input
              className="finput code-input"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && login()}
              placeholder="XXXXXX"
              maxLength={12}
              autoFocus
            />
            {err && <p className="err">{err}</p>}
            <button className="btn solid wide" onClick={login} disabled={loading}>
              {loading ? "Verifying…" : "Enter →"}
            </button>
            <p className="hint">Clients receive their code from DUPSCALED. Admins use their PIN.</p>
          </div>
        </div>
      )}
      {view === "admin" && <Admin settings={settings} setSettings={setSettings} onLogout={() => { setView("login"); setCode(""); }} />}
      {view === "client" && <ClientPortal client={me} setClient={setMe} onLogout={() => { setView("login"); setCode(""); setMe(null); }} />}
    </div>
  );
}

function Admin({ settings, setSettings, onLogout }) {
  const [clients, setClients] = useState(null);
  const [sel, setSel] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const loadAll = useCallback(async () => {
    const idx = (await sget("clients:index")) || [];
    const out = [];
    for (const c of idx) {
      const cl = await sget("client:" + c);
      if (cl) out.push(cl);
    }
    setClients(out);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const saveClient = async (cl) => {
    await sset("client:" + cl.code, cl);
    setClients((prev) => prev.map((p) => (p.code === cl.code ? cl : p)));
  };

  const createClient = async (name) => {
    let codeNew = genCode();
    const idx = (await sget("clients:index")) || [];
    while (idx.includes(codeNew)) codeNew = genCode();
    const cl = {
      code: codeNew, name, createdAt: Date.now(), stage: "Lead",
      adminNotes: "", onboardingComplete: false, onboarding: { ...emptyOnboarding },
      deliverables: [], analytics: [],
    };
    await sset("client:" + codeNew, cl);
    await sset("clients:index", [...idx, codeNew]);
    setClients((p) => [...(p || []), cl]);
    setShowNew(false);
    setSel(codeNew);
  };

  const deleteClient = async (codeDel) => {
    const idx = (await sget("clients:index")) || [];
    await sset("clients:index", idx.filter((c) => c !== codeDel));
    await sdel("client:" + codeDel);
    setClients((p) => p.filter((c) => c.code !== codeDel));
    setSel(null);
  };

  const selected = clients?.find((c) => c.code === sel);

  return (
    <div className="shell">
      <TopBar label="ADMIN" onLogout={onLogout} extra={
        <button className="btn small" onClick={() => setShowSettings(true)}>Settings</button>
      } />
      {!selected ? (
        <div className="page">
          <Stats clients={clients} />
          <div className="row-between">
            <h2 className="h2">Clients</h2>
            <button className="btn solid" onClick={() => setShowNew(true)}>+ New client</button>
          </div>
          {clients === null ? <p className="mute">Loading…</p> :
            clients.length === 0 ? (
              <div className="empty">No clients yet. Create the first one and send them their access code.</div>
            ) : (
              <div className="cgrid">
                {clients.sort((a, b) => b.createdAt - a.createdAt).map((c) => (
                  <button key={c.code} className="ccard" onClick={() => setSel(c.code)}>
                    <div className="ccard-top">
                      <div className="avatar">{c.name.slice(0, 2).toUpperCase()}</div>
                      <div>
                        <h3>{c.name}</h3>
                        <span className="mono-sm">{c.code}</span>
                      </div>
                    </div>
                    <div className="ccard-foot">
                      <span className={"pill " + (c.stage === "Active" ? "pill-on" : "")}>{c.stage}</span>
                      <span className="mono-sm">{c.onboardingComplete ? "✓ Onboarding done" : "○ Awaiting onboarding"}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
        </div>
      ) : (
        <ClientDetail client={selected} save={saveClient} del={deleteClient} back={() => setSel(null)} />
      )}
      {showNew && <NewClientModal onClose={() => setShowNew(false)} onCreate={createClient} />}
      {showSettings && <SettingsModal settings={settings} setSettings={setSettings} onClose={() => setShowSettings(false)} />}
    </div>
  );
}

function Stats({ clients }) {
  const c = clients || [];
  const items = [
    ["Total clients", c.length],
    ["Active", c.filter((x) => x.stage === "Active").length],
    ["Pending onboarding", c.filter((x) => !x.onboardingComplete).length],
    ["Deliverables in progress", c.reduce((n, x) => n + (x.deliverables || []).filter((d) => d.status !== "Delivered").length, 0)],
  ];
  return (
    <div className="stats">
      {items.map(([l, v]) => (
        <div className="stat-box" key={l}><b>{v}</b><span>{l}</span></div>
      ))}
    </div>
  );
}

function NewClientModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  return (
    <Modal title="New client" onClose={onClose}>
      <label className="flabel">Name / brand</label>
      <input className="finput" value={name} onChange={(e) => setName(e.target.value)} autoFocus
        onKeyDown={(e) => e.key === "Enter" && name.trim() && onCreate(name.trim())} placeholder="e.g. MrSavage" />
      <button className="btn solid wide" style={{ marginTop: 16 }} disabled={!name.trim()} onClick={() => onCreate(name.trim())}>
        Create & generate code →
      </button>
    </Modal>
  );
}

function SettingsModal({ settings, setSettings, onClose }) {
  const [pin, setPin] = useState(settings?.adminPin || "");
  const save = async () => {
    const st = { ...settings, adminPin: pin.trim() || "DUPSCALED" };
    await sset("settings", st); setSettings(st); onClose();
  };
  return (
    <Modal title="Settings" onClose={onClose}>
      <label className="flabel">Admin PIN</label>
      <input className="finput" value={pin} onChange={(e) => setPin(e.target.value)} />
      <p className="hint" style={{ marginTop: 10 }}>Default PIN is DUPSCALED — change it now.</p>
      <button className="btn solid wide" style={{ marginTop: 16 }} onClick={save}>Save</button>
    </Modal>
  );
}

function ClientDetail({ client, save, del, back }) {
  const [tab, setTab] = useState("overview");
  const [copied, setCopied] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const copy = () => {
    try { navigator.clipboard.writeText(client.code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  return (
    <div className="page">
      <button className="ghost" onClick={back}>← Back to clients</button>
      <div className="detail-head">
        <div className="ccard-top">
          <div className="avatar lg">{client.name.slice(0, 2).toUpperCase()}</div>
          <div>
            <h2 className="h2" style={{ margin: 0 }}>{client.name}</h2>
            <div className="row" style={{ gap: 10, marginTop: 6 }}>
              <span className="mono-sm">Code: {client.code}</span>
              <button className="ghost small" onClick={copy}>{copied ? "✓ Copied" : "Copy code"}</button>
            </div>
          </div>
        </div>
        <select className="finput stage-sel" value={client.stage} onChange={(e) => save({ ...client, stage: e.target.value })}>
          {STAGES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="tabs">
        {[["overview", "Overview"], ["analytics", "Analytics"], ["deliverables", "Deliverables"], ["onboarding", "Onboarding data"], ["notes", "Notes"]].map(([k, l]) => (
          <button key={k} className={"tab " + (tab === k ? "on" : "")} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="panel">
          <Row k="Onboarding status" v={client.onboardingComplete ? "✓ Complete" : "○ Incomplete"} />
          <Row k="Contact" v={client.onboarding.contactName || "—"} />
          <Row k="Email" v={client.onboarding.email || "—"} />
          <Row k="Goals" v={client.onboarding.goals || "—"} />
          <Row k="Deliverables" v={`${(client.deliverables || []).filter(d => d.status === "Delivered").length} / ${(client.deliverables || []).length} done`} />
          <div style={{ padding: "18px 22px" }}>
            {!confirmDel
              ? <button className="ghost danger" onClick={() => setConfirmDel(true)}>Delete client</button>
              : <span className="row" style={{ gap: 12 }}>
                  <span className="mono-sm" style={{ color: "#ff6b6b" }}>Really delete? This cannot be undone.</span>
                  <button className="ghost danger" onClick={() => del(client.code)}>Yes, delete</button>
                  <button className="ghost" onClick={() => setConfirmDel(false)}>Cancel</button>
                </span>}
          </div>
        </div>
      )}

      {tab === "analytics" && <Analytics client={client} save={save} editable />}
      {tab === "deliverables" && <Deliverables client={client} save={save} editable />}
      {tab === "onboarding" && <OnboardingView ob={client.onboarding} />}

      {tab === "notes" && (
        <div className="panel" style={{ padding: 22 }}>
          <label className="flabel">Internal notes (client cannot see these)</label>
          <textarea className="finput" rows={8} value={client.adminNotes}
            onChange={(e) => save({ ...client, adminNotes: e.target.value })}
            placeholder="Pricing, agreements, call notes…" />
        </div>
      )}
    </div>
  );
}

function Row({ k, v }) {
  return <div className="krow"><span>{k}</span><b>{v}</b></div>;
}

function OnboardingView({ ob }) {
  return (
    <div className="panel">
      <div className="panel-sec">BASICS & GOALS</div>
      <Row k="Contact person" v={ob.contactName || "—"} />
      <Row k="Email" v={ob.email || "—"} />
      <Row k="Brand / company" v={ob.company || "—"} />
      <Row k="Goals" v={ob.goals || "—"} />
      <Row k="Target audience" v={ob.audience || "—"} />
      <Row k="Competitors / inspiration" v={ob.competitors || "—"} />
      <div className="panel-sec">BRAND ASSETS</div>
      <Row k="Colors" v={ob.colors || "—"} />
      <Row k="Fonts" v={ob.fonts || "—"} />
      <Row k="Logo (link)" v={ob.logoLink || "—"} />
      <Row k="Other assets (link)" v={ob.assetsLink || "—"} />
      <Row k="Style notes" v={ob.styleNotes || "—"} />
      <div className="panel-sec">SOCIAL MEDIA</div>
      {(ob.socials || []).map((s, i) => (
        <Row key={i} k={s.platform} v={(s.handle || "—") + (s.access ? "  ·  access: " + s.access : "")} />
      ))}
      {ob.notes && <><div className="panel-sec">OTHER</div><Row k="Client note" v={ob.notes} /></>}
    </div>
  );
}

function Deliverables({ client, save, editable }) {
  const [title, setTitle] = useState("");
  const list = client.deliverables || [];

  const add = () => {
    if (!title.trim()) return;
    save({ ...client, deliverables: [...list, { id: Date.now(), title: title.trim(), status: "Brief", due: "" }] });
    setTitle("");
  };
  const update = (id, patch) => save({ ...client, deliverables: list.map((d) => (d.id === id ? { ...d, ...patch } : d)) });
  const remove = (id) => save({ ...client, deliverables: list.filter((d) => d.id !== id) });

  return (
    <div className="panel">
      {editable && (
        <div className="row" style={{ padding: "16px 22px", gap: 10, borderBottom: "1px solid var(--line)" }}>
          <input className="finput" style={{ flex: 1 }} value={title} onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()} placeholder="e.g. 10× short-form clips / week 24" />
          <button className="btn small solid" onClick={add}>Add</button>
        </div>
      )}
      {list.length === 0 && <div className="empty" style={{ border: 0 }}>No deliverables yet.</div>}
      {list.map((d) => (
        <div className="dlv" key={d.id}>
          <span className="dlv-dot" style={{ background: DSTATUS_COLOR[d.status] }} />
          <div className="dlv-main">
            <b>{d.title}</b>
            {d.due && <span className="mono-sm">due {d.due}</span>}
          </div>
          {editable ? (
            <>
              <input className="finput tiny" type="date" value={d.due} onChange={(e) => update(d.id, { due: e.target.value })} />
              <select className="finput tiny" value={d.status} onChange={(e) => update(d.id, { status: e.target.value })}>
                {DSTATUS.map((s) => <option key={s}>{s}</option>)}
              </select>
              <button className="ghost danger small" onClick={() => remove(d.id)}>×</button>
            </>
          ) : (
            <span className="pill" style={{ borderColor: DSTATUS_COLOR[d.status], color: DSTATUS_COLOR[d.status] }}>{d.status}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function ClientPortal({ client, setClient, onLogout }) {
  const [local, setLocal] = useState(client);
  const refresh = useCallback(async () => {
    const fresh = await sget("client:" + client.code);
    if (fresh) { setLocal(fresh); setClient(fresh); }
  }, [client.code, setClient]);

  useEffect(() => { refresh(); }, [refresh]);

  const save = async (cl) => { await sset("client:" + cl.code, cl); setLocal(cl); setClient(cl); };

  if (!local.onboardingComplete) return <Wizard client={local} save={save} onLogout={onLogout} />;

  return (
    <div className="shell">
      <TopBar label={local.name} onLogout={onLogout} />
      <div className="page">
        <p className="eyebrow">YOUR PROJECT</p>
        <h2 className="h2">Hey, {local.onboarding.contactName?.split(" ")[0] || local.name} 👋</h2>
        <p className="mute" style={{ marginBottom: 28 }}>Here you can track all your deliverables. If anything is missing, reach out to us.</p>
        <h3 className="h3" style={{ margin: "0 0 14px" }}>Your numbers</h3>
        <Analytics client={local} save={save} editable={false} />
        <h3 className="h3" style={{ margin: "40px 0 14px" }}>Deliverables</h3>
        <Deliverables client={local} save={save} editable={false} />
        <h3 className="h3" style={{ margin: "40px 0 14px" }}>Your onboarding details</h3>
        <OnboardingView ob={local.onboarding} />
        <button className="ghost" style={{ marginTop: 20 }}
          onClick={() => save({ ...local, onboardingComplete: false })}>
          ✎ Edit onboarding details
        </button>
      </div>
    </div>
  );
}

function Wizard({ client, save, onLogout }) {
  const [step, setStep] = useState(0);
  const [ob, setOb] = useState(client.onboarding || emptyOnboarding);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setOb((p) => ({ ...p, [k]: v }));

  const steps = ["Basics & goals", "Brand assets", "Social media", "Summary"];

  const finish = async () => {
    setSaving(true);
    await save({ ...client, onboarding: ob, onboardingComplete: true });
    setSaving(false);
  };

  const setSocial = (i, patch) => set("socials", ob.socials.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  return (
    <div className="shell">
      <TopBar label={client.name} onLogout={onLogout} />
      <div className="page narrow">
        <p className="eyebrow">ONBOARDING — {step + 1} / {steps.length}</p>
        <h2 className="h2">{steps[step]}</h2>
        <div className="progress"><div style={{ width: ((step + 1) / steps.length) * 100 + "%" }} /></div>

        {step === 0 && (
          <div className="form-stack">
            <Field l="Contact person" v={ob.contactName} on={(v) => set("contactName", v)} ph="Full name" />
            <Field l="Email" v={ob.email} on={(v) => set("email", v)} ph="you@email.com" type="email" />
            <Field l="Brand / company" v={ob.company} on={(v) => set("company", v)} ph="Brand name" />
            <Field l="What do you want to achieve?" v={ob.goals} on={(v) => set("goals", v)} area ph="Grow followers, views, sales, personal brand…" />
            <Field l="Who is your target audience?" v={ob.audience} on={(v) => set("audience", v)} area ph="Age, interests, platforms…" />
            <Field l="Competitors or accounts you like" v={ob.competitors} on={(v) => set("competitors", v)} area ph="Links or @handles" />
          </div>
        )}

        {step === 1 && (
          <div className="form-stack">
            <Field l="Brand colors" v={ob.colors} on={(v) => set("colors", v)} ph="#06080A, #2BFF87…" />
            <Field l="Fonts" v={ob.fonts} on={(v) => set("fonts", v)} ph="Archivo, Space Grotesk…" />
            <Field l="Logo — download link" v={ob.logoLink} on={(v) => set("logoLink", v)} ph="Google Drive / Dropbox link" />
            <Field l="Other assets — link" v={ob.assetsLink} on={(v) => set("assetsLink", v)} ph="Photos, B-roll, brand manual…" />
            <Field l="Style notes" v={ob.styleNotes} on={(v) => set("styleNotes", v)} area ph="What you like / dislike, tone of voice…" />
          </div>
        )}

        {step === 2 && (
          <div className="form-stack">
            <div className="warn">
              ⚠ Never enter passwords here. In the "access" field, only describe how you will grant access (e.g. "Meta Business invite", "I'll send the password via 1Password / Signal").
            </div>
            {ob.socials.map((s, i) => (
              <div className="social-row" key={i}>
                <select className="finput" value={s.platform} onChange={(e) => setSocial(i, { platform: e.target.value })}>
                  {["Instagram", "TikTok", "YouTube", "X / Twitter", "Facebook", "LinkedIn", "Twitch"].map((p) => <option key={p}>{p}</option>)}
                </select>
                <input className="finput" value={s.handle} onChange={(e) => setSocial(i, { handle: e.target.value })} placeholder="@handle" />
                <input className="finput" value={s.access} onChange={(e) => setSocial(i, { access: e.target.value })} placeholder="How will you grant access" />
                {ob.socials.length > 1 && <button className="ghost danger small" onClick={() => set("socials", ob.socials.filter((_, j) => j !== i))}>×</button>}
              </div>
            ))}
            <button className="ghost" onClick={() => set("socials", [...ob.socials, { platform: "TikTok", handle: "", access: "" }])}>+ Add platform</button>
          </div>
        )}

        {step === 3 && (
          <>
            <OnboardingView ob={ob} />
            <Field l="Anything else we should know?" v={ob.notes} on={(v) => set("notes", v)} area ph="Optional" />
          </>
        )}

        <div className="row-between" style={{ marginTop: 28 }}>
          {step > 0 ? <button className="ghost" onClick={() => setStep(step - 1)}>← Back</button> : <span />}
          {step < 3
            ? <button className="btn solid" onClick={() => setStep(step + 1)}>Continue →</button>
            : <button className="btn solid" onClick={finish} disabled={saving}>{saving ? "Submitting…" : "Submit onboarding ✓"}</button>}
        </div>
      </div>
    </div>
  );
}

function Field({ l, v, on, ph, area, type }) {
  return (
    <div className="field-wrap">
      <label className="flabel">{l}</label>
      {area
        ? <textarea className="finput" rows={3} value={v} onChange={(e) => on(e.target.value)} placeholder={ph} />
        : <input className="finput" type={type || "text"} value={v} onChange={(e) => on(e.target.value)} placeholder={ph} />}
    </div>
  );
}

function Analytics({ client, save, editable }) {
  const entries = [...(client.analytics || [])].sort((a, b) => a.date.localeCompare(b.date));
  const [metric, setMetric] = useState("followers");
  const [mode, setMode] = useState("total");
  const [showForm, setShowForm] = useState(false);
  const [showLog, setShowLog] = useState(false);

  const valOf = (e, p) => Number(e?.[p]?.[metric] ?? 0);
  const totalData = entries.map((e) => ({
    date: e.date.slice(5).replace("-", "/"),
    ...Object.fromEntries(PLATFORMS.map((p) => [p.key, valOf(e, p.key)])),
  }));
  const deltaData = entries.slice(1).map((e, i) => ({
    date: e.date.slice(5).replace("-", "/"),
    ...Object.fromEntries(PLATFORMS.map((p) => [p.key, valOf(e, p.key) - valOf(entries[i], p.key)])),
  }));
  const chartData = mode === "total" ? totalData : deltaData;

  const latest = entries[entries.length - 1];
  const prev = entries[entries.length - 2];

  const addEntry = (entry) => {
    save({ ...client, analytics: [...(client.analytics || []), entry] });
    setShowForm(false);
  };
  const removeEntry = (id) => save({ ...client, analytics: (client.analytics || []).filter((e) => e.id !== id) });

  const tooltipStyle = {
    contentStyle: { background: "#0c1115", border: "1px solid rgba(234,242,238,.18)", borderRadius: 4, fontSize: 12, fontFamily: "'JetBrains Mono',monospace" },
    labelStyle: { color: "#8c988f" },
  };

  return (
    <div>
      <div className="an-cards">
        {PLATFORMS.map((p) => {
          const f = latest ? Number(latest[p.key]?.followers ?? 0) : null;
          const v = latest ? Number(latest[p.key]?.views ?? 0) : null;
          const df = latest && prev ? f - Number(prev[p.key]?.followers ?? 0) : null;
          const dv = latest && prev ? v - Number(prev[p.key]?.views ?? 0) : null;
          return (
            <div className="an-card" key={p.key}>
              <span className="an-plat" style={{ color: p.color }}>● {p.label}</span>
              <div className="an-metric">
                <b>{fmtN(f)}</b><span>Followers {df != null && <i className={df >= 0 ? "up" : "down"}>{df >= 0 ? "+" : ""}{fmtN(df)}</i>}</span>
              </div>
              <div className="an-metric">
                <b>{fmtN(v)}</b><span>Views {dv != null && <i className={dv >= 0 ? "up" : "down"}>{dv >= 0 ? "+" : ""}{fmtN(dv)}</i>}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="row-between" style={{ marginBottom: 14 }}>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <div className="seg">
            {[["followers", "Followers"], ["views", "Views"]].map(([k, l]) => (
              <button key={k} className={metric === k ? "on" : ""} onClick={() => setMetric(k)}>{l}</button>
            ))}
          </div>
          <div className="seg">
            {[["total", "Total"], ["delta", "Weekly +"]].map(([k, l]) => (
              <button key={k} className={mode === k ? "on" : ""} onClick={() => setMode(k)}>{l}</button>
            ))}
          </div>
        </div>
        {editable && <button className="btn small solid" onClick={() => setShowForm(true)}>+ Log week</button>}
      </div>

      <div className="panel" style={{ padding: "22px 12px 10px" }}>
        {chartData.length === 0 ? (
          <div className="empty" style={{ border: 0 }}>
            {mode === "delta" && entries.length === 1
              ? "Weekly growth will show after the second entry."
              : editable ? "No data yet. Log the first week using the button above." : "Stats will appear once the team logs them."}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            {mode === "total" ? (
              <LineChart data={chartData}>
                <CartesianGrid stroke="rgba(234,242,238,.07)" vertical={false} />
                <XAxis dataKey="date" stroke="#8c988f" tick={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }} tickLine={false} axisLine={{ stroke: "rgba(234,242,238,.18)" }} />
                <YAxis stroke="#8c988f" tick={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }} tickFormatter={fmtN} tickLine={false} axisLine={false} width={48} />
                <Tooltip {...tooltipStyle} formatter={(v) => fmtN(v)} />
                <Legend wrapperStyle={{ fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }} />
                {PLATFORMS.map((p) => (
                  <Line key={p.key} type="monotone" dataKey={p.key} name={p.label} stroke={p.color} strokeWidth={2.5} dot={{ r: 3, fill: p.color }} activeDot={{ r: 5 }} />
                ))}
              </LineChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid stroke="rgba(234,242,238,.07)" vertical={false} />
                <XAxis dataKey="date" stroke="#8c988f" tick={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }} tickLine={false} axisLine={{ stroke: "rgba(234,242,238,.18)" }} />
                <YAxis stroke="#8c988f" tick={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }} tickFormatter={fmtN} tickLine={false} axisLine={false} width={48} />
                <Tooltip {...tooltipStyle} formatter={(v) => fmtN(v)} cursor={{ fill: "rgba(43,255,135,.05)" }} />
                <Legend wrapperStyle={{ fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }} />
                {PLATFORMS.map((p) => (
                  <Bar key={p.key} dataKey={p.key} name={p.label} fill={p.color} radius={[2, 2, 0, 0]} maxBarSize={22} />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {editable && entries.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <button className="ghost" onClick={() => setShowLog(!showLog)}>{showLog ? "▾ Hide entries" : "▸ Show entries"} ({entries.length})</button>
          {showLog && (
            <div className="panel" style={{ marginTop: 10 }}>
              {[...entries].reverse().map((e) => (
                <div className="dlv" key={e.id}>
                  <div className="dlv-main">
                    <b style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>{e.date}</b>
                    <span className="mono-sm" style={{ textTransform: "none" }}>
                      {PLATFORMS.map((p) => `${p.label}: ${fmtN(Number(e[p.key]?.followers ?? 0))} fol / ${fmtN(Number(e[p.key]?.views ?? 0))} views`).join("  ·  ")}
                    </span>
                  </div>
                  <button className="ghost danger small" onClick={() => removeEntry(e.id)}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showForm && <EntryModal onClose={() => setShowForm(false)} onAdd={addEntry} latest={latest} />}
    </div>
  );
}

function EntryModal({ onClose, onAdd, latest }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [vals, setVals] = useState(() => {
    const o = {};
    PLATFORMS.forEach((p) => { o[p.key] = { followers: latest?.[p.key]?.followers ?? "", views: latest?.[p.key]?.views ?? "" }; });
    return o;
  });
  const set = (pk, mk, v) => setVals((prev) => ({ ...prev, [pk]: { ...prev[pk], [mk]: v } }));
  const submit = () => {
    const entry = { id: Date.now(), date };
    PLATFORMS.forEach((p) => {
      entry[p.key] = { followers: Number(vals[p.key].followers) || 0, views: Number(vals[p.key].views) || 0 };
    });
    onAdd(entry);
  };
  return (
    <Modal title="Log weekly stats" onClose={onClose}>
      <label className="flabel">Entry date</label>
      <input className="finput" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <p className="hint" style={{ textAlign: "left", margin: "10px 0 4px" }}>Enter cumulative totals — the chart calculates weekly growth automatically. Pre-filled from last week.</p>
      {PLATFORMS.map((p) => (
        <div key={p.key} style={{ marginTop: 14 }}>
          <span className="an-plat" style={{ color: p.color }}>● {p.label}</span>
          <div className="entry-grid">
            <div><label className="flabel">Followers</label>
              <input className="finput" type="number" min="0" value={vals[p.key].followers} onChange={(e) => set(p.key, "followers", e.target.value)} placeholder="0" /></div>
            <div><label className="flabel">Views (total)</label>
              <input className="finput" type="number" min="0" value={vals[p.key].views} onChange={(e) => set(p.key, "views", e.target.value)} placeholder="0" /></div>
          </div>
        </div>
      ))}
      <button className="btn solid wide" style={{ marginTop: 20 }} onClick={submit}>Save entry ✓</button>
    </Modal>
  );
}

function TopBar({ label, onLogout, extra }) {
  return (
    <div className="topbar">
      <div className="topbar-logo">
        <Image src="/logo.png" width={120} height={14} alt="DUPSCALED" style={{ filter: "invert(1) brightness(10)", opacity: 0.9 }} />
        <span className="bar-label">/ {label}</span>
      </div>
      <div className="row" style={{ gap: 10 }}>
        {extra}
        <button className="btn small" onClick={onLogout}>Log out</button>
      </div>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="row-between" style={{ marginBottom: 18 }}>
          <h3 className="h3">{title}</h3>
          <button className="ghost" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Style() {
  return (
    <style>{`
:root{
  --ink:#06080a; --panel:#0c1115; --panel2:#0a0e12;
  --line:rgba(234,242,238,.09); --line-strong:rgba(234,242,238,.18);
  --text:#eaf2ee; --mute:#8c988f;
  --signal:#2bff87; --signal-soft:rgba(43,255,135,.12); --signal-line:rgba(43,255,135,.4);
  --mono:'JetBrains Mono',ui-monospace,monospace;
}
*{box-sizing:border-box;margin:0;padding:0}
.app{min-height:100vh;background:
  radial-gradient(900px 500px at 85% -5%, rgba(43,255,135,.06), transparent 60%), var(--ink);
  color:var(--text);font-family:'Space Grotesk','Segoe UI',sans-serif;font-size:15px;line-height:1.55}
button{font:inherit;cursor:pointer;background:none;border:0;color:inherit}
input,select,textarea{font:inherit;color:var(--text)}
::selection{background:var(--signal);color:var(--ink)}
:focus-visible{outline:2px solid var(--signal);outline-offset:2px;border-radius:2px}
.topbar-logo{display:flex;align-items:center;gap:10px}
.bar-label{color:var(--mute);font-weight:400;font-size:12px;font-family:var(--mono);letter-spacing:.14em}
.logo-wrap{display:flex;justify-content:center;padding:4px 0 8px}
.h2{font-size:26px;font-weight:700;text-transform:uppercase;letter-spacing:.01em;margin-bottom:8px}
.h3{font-size:17px;font-weight:700;text-transform:uppercase}
.mute{color:var(--mute)}
.mono-sm{font-family:var(--mono);font-size:11px;letter-spacing:.1em;color:var(--mute);text-transform:uppercase}
.eyebrow{font-family:var(--mono);font-size:10.5px;letter-spacing:.22em;color:var(--signal);margin-bottom:10px}
.row{display:flex;align-items:center}
.row-between{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:18px;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-family:var(--mono);font-size:11.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:12px 20px;border:1px solid var(--signal-line);color:var(--signal);border-radius:3px;transition:all .2s;white-space:nowrap}
.btn:hover{background:var(--signal);color:var(--ink);box-shadow:0 0 24px rgba(43,255,135,.35)}
.btn.solid{background:var(--signal);color:var(--ink)}
.btn.small{padding:9px 14px;font-size:10.5px}
.btn.wide{width:100%}
.btn:disabled{opacity:.5;pointer-events:none}
.ghost{font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);padding:8px 4px;transition:color .2s}
.ghost:hover{color:var(--text)}
.ghost.danger{color:#ff6b6b}
.ghost.small{padding:4px 8px}
.login-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
.login-card{width:100%;max-width:400px;background:var(--panel2);border:1px solid var(--line);border-radius:4px;padding:38px 34px;display:flex;flex-direction:column;gap:14px}
.login-sub{font-family:var(--mono);font-size:10px;letter-spacing:.3em;color:var(--mute);margin:-6px 0 14px;text-align:center}
.code-input{font-family:var(--mono);font-size:22px;letter-spacing:.3em;text-align:center;text-transform:uppercase}
.err{color:#ff6b6b;font-size:13px}
.hint{font-size:12px;color:var(--mute);text-align:center;margin-top:4px}
.shell{min-height:100vh}
.topbar{display:flex;align-items:center;justify-content:space-between;padding:0 clamp(16px,4vw,40px);height:60px;border-bottom:1px solid var(--line);background:rgba(6,8,10,.8);position:sticky;top:0;z-index:10;backdrop-filter:blur(10px)}
.page{max-width:1060px;margin:0 auto;padding:clamp(24px,5vw,48px) clamp(16px,4vw,40px)}
.page.narrow{max-width:680px}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1px;background:var(--line);border:1px solid var(--line);border-radius:3px;overflow:hidden;margin-bottom:36px}
.stat-box{background:var(--panel2);padding:20px 18px}
.stat-box b{display:block;font-family:var(--mono);font-size:30px;color:var(--signal);line-height:1}
.stat-box span{font-family:var(--mono);font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--mute);display:block;margin-top:9px}
.cgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:14px}
.ccard{text-align:left;background:var(--panel2);border:1px solid var(--line);border-radius:3px;padding:20px;display:flex;flex-direction:column;gap:18px;transition:all .2s;position:relative;overflow:hidden}
.ccard::before{content:"";position:absolute;top:0;left:0;width:100%;height:2px;background:var(--signal);transform:scaleX(0);transform-origin:left;transition:transform .25s}
.ccard:hover{background:var(--panel)}
.ccard:hover::before{transform:scaleX(1)}
.ccard-top{display:flex;align-items:center;gap:13px}
.ccard h3{font-size:16px;font-weight:700;text-transform:uppercase}
.ccard-foot{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}
.avatar{width:42px;height:42px;border-radius:3px;background:var(--signal-soft);border:1px solid var(--signal-line);display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-weight:700;font-size:14px;color:var(--signal);flex-shrink:0}
.avatar.lg{width:54px;height:54px;font-size:17px}
.pill{font-family:var(--mono);font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;border:1px solid var(--line-strong);color:var(--mute);padding:5px 10px;border-radius:2px}
.pill-on{border-color:var(--signal-line);color:var(--signal)}
.empty{border:1px dashed var(--line-strong);border-radius:3px;padding:40px;text-align:center;color:var(--mute);font-size:14px}
.detail-head{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin:18px 0 26px}
.stage-sel{max-width:200px}
.tabs{display:flex;gap:4px;border-bottom:1px solid var(--line);margin-bottom:22px;overflow-x:auto}
.tab{font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);padding:12px 16px;border-bottom:2px solid transparent;margin-bottom:-1px;white-space:nowrap}
.tab.on{color:var(--signal);border-color:var(--signal)}
.panel{background:var(--panel2);border:1px solid var(--line);border-radius:3px;overflow:hidden}
.panel-sec{font-family:var(--mono);font-size:9.5px;letter-spacing:.24em;color:var(--signal);padding:16px 22px 8px;border-bottom:1px solid var(--line);background:var(--panel)}
.krow{display:grid;grid-template-columns:200px 1fr;gap:14px;padding:13px 22px;border-bottom:1px solid var(--line);font-size:14px}
.krow span{font-family:var(--mono);font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);padding-top:2px}
.krow b{font-weight:500;white-space:pre-wrap;word-break:break-word}
@media(max-width:560px){.krow{grid-template-columns:1fr;gap:4px}}
.dlv{display:flex;align-items:center;gap:14px;padding:14px 22px;border-bottom:1px solid var(--line);flex-wrap:wrap}
.dlv-dot{width:9px;height:9px;border-radius:50%;flex-shrink:0}
.dlv-main{flex:1;min-width:160px;display:flex;flex-direction:column;gap:2px}
.dlv-main b{font-weight:600;font-size:14.5px}
.flabel{font-family:var(--mono);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--mute);display:block;margin-bottom:7px}
.finput{width:100%;background:var(--panel);border:1px solid var(--line);border-radius:3px;padding:12px 14px;font-size:15px;transition:border-color .2s;resize:vertical}
.finput:focus{outline:none;border-color:var(--signal-line);background:rgba(43,255,135,.03)}
.finput.tiny{width:auto;padding:8px 10px;font-size:12px;font-family:var(--mono)}
select.finput{appearance:none;cursor:pointer}
.form-stack{display:flex;flex-direction:column;gap:18px;margin-top:22px}
.field-wrap{display:flex;flex-direction:column}
.progress{height:3px;background:var(--line);border-radius:2px;margin:14px 0 8px;overflow:hidden}
.progress div{height:100%;background:var(--signal);transition:width .4s ease;box-shadow:0 0 12px rgba(43,255,135,.6)}
.social-row{display:grid;grid-template-columns:130px 1fr 1fr auto;gap:8px;align-items:center}
@media(max-width:640px){.social-row{grid-template-columns:1fr}}
.warn{border:1px solid rgba(255,201,77,.4);background:rgba(255,201,77,.07);color:#ffc94d;border-radius:3px;padding:14px 16px;font-size:13px;line-height:1.5}
.overlay{position:fixed;inset:0;background:rgba(4,6,8,.8);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px;z-index:50;overflow-y:auto}
.modal{width:100%;max-width:420px;background:var(--panel2);border:1px solid var(--line-strong);border-radius:4px;padding:28px;margin:auto}
.an-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1px;background:var(--line);border:1px solid var(--line);border-radius:3px;overflow:hidden;margin-bottom:18px}
.an-card{background:var(--panel2);padding:18px 20px;display:flex;flex-direction:column;gap:10px}
.an-plat{font-family:var(--mono);font-size:10px;letter-spacing:.2em;text-transform:uppercase}
.an-metric b{display:block;font-family:var(--mono);font-size:24px;line-height:1;color:var(--text)}
.an-metric span{font-family:var(--mono);font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--mute);display:flex;gap:8px;margin-top:5px;align-items:baseline}
.an-metric i{font-style:normal;font-weight:700}
.an-metric i.up{color:var(--signal)}
.an-metric i.down{color:#ff6b6b}
.seg{display:inline-flex;border:1px solid var(--line-strong);border-radius:3px;overflow:hidden}
.seg button{font-family:var(--mono);font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);padding:9px 14px;transition:all .15s}
.seg button.on{background:var(--signal);color:var(--ink);font-weight:700}
.entry-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px}
    `}</style>
  );
}
