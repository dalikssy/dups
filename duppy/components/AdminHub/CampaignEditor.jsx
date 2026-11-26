"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "./api";
import CampaignReport from "@/components/Portal/CampaignReport";
import { CAMPAIGN_PLATFORMS, FIELDS } from "@/lib/campaignFields";

const HINT = { views: "40.6K", play_time_h: "141h:07m", avg_watch_s: "12.2", avg_viewed_pct: "58.2", full_pct: "4.38" };

// "Label: value" per line <-> [{label, value}]
const toText = (items) => (items || []).map((h) => `${h.label}: ${h.value}`).join("\n");
const fromText = (text) =>
  text
    .split("\n")
    .map((line) => line.split(":"))
    .filter((parts) => parts.length > 1)
    .map(([label, ...rest]) => ({ label: label.trim(), value: rest.join(":").trim() }));

function Video({ video, onSave, onDelete }) {
  const [v, setV] = useState(video);
  useEffect(() => setV(video), [video]);
  const stats = v.stats || {};
  const setStat = (platform, key, value) => setV({ ...v, stats: { ...stats, [platform]: { ...stats[platform], [key]: value } } });
  const toggle = (platform) => {
    const next = { ...stats };
    if (next[platform]) delete next[platform];
    else next[platform] = {};
    setV({ ...v, stats: next });
  };

  return (
    <form
      className="cmp-video"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(v);
      }}
    >
      <div className="cmp-video-head">
        <label className="lbl">
          Video title
          <input className="field" required value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} placeholder="e.g. Every setting I use in 60 seconds" />
        </label>
        <label className="lbl">
          Posted
          <input className="field" type="date" value={v.posted_on || ""} onChange={(e) => setV({ ...v, posted_on: e.target.value })} />
        </label>
        <label className="lbl">
          Length (s)
          <input className="field" inputMode="decimal" value={v.length_s ?? ""} onChange={(e) => setV({ ...v, length_s: e.target.value })} placeholder="50.3" />
        </label>
      </div>

      <div className="row cmp-chips">
        {CAMPAIGN_PLATFORMS.map((p) => (
          <button key={p.key} type="button" className={`cmp-chip ${stats[p.key] ? "on" : ""}`} style={{ "--c": p.color }} aria-pressed={Boolean(stats[p.key])} onClick={() => toggle(p.key)}>
            <i />
            {p.label}
          </button>
        ))}
      </div>

      {CAMPAIGN_PLATFORMS.filter((p) => stats[p.key]).map((p) => (
        <div key={p.key} className="cmp-edit-plat" style={{ "--c": p.color }}>
          <div className="row"><span className="tag">{p.label}</span></div>
          <div className="cmp-fields">
            <label className="lbl" style={{ gridColumn: "span 2" }}>
              Title on {p.label} (optional)
              <input className="field" value={stats[p.key].title || ""} onChange={(e) => setStat(p.key, "title", e.target.value)} />
            </label>
            {FIELDS.map((f) => (
              <label className="lbl" key={f.key}>
                {f.label}
                {f.unit ? ` (${f.unit})` : ""}
                <input className="field" inputMode="decimal" placeholder={HINT[f.key] || ""} value={stats[p.key][f.key] ?? ""} onChange={(e) => setStat(p.key, f.key, e.target.value)} />
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className="row">
        <button className="btn primary" type="submit">Save video</button>
        {onDelete && <button className="btn quiet danger" type="button" onClick={() => onDelete(v)}>Remove video</button>}
      </div>
    </form>
  );
}

// The team's editor for one campaign, with the client's view right below it.
export default function CampaignEditor({ clientId, campaignId }) {
  const [campaign, setCampaign] = useState(null);
  const [meta, setMeta] = useState(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const base = `/clients/${clientId}/campaigns/${campaignId}`;

  const load = useCallback(async () => {
    try {
      const { campaign: c } = await api(base);
      setCampaign(c);
      setMeta({ name: c.name, brand: c.brand || "", starts: c.starts || "", ends: c.ends || "", summary: c.summary || "", highlights: toText(c.highlights) });
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, [base]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn, message) => {
    setError("");
    setSaved("");
    try {
      await fn();
      await load();
      if (message) setSaved(message);
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  };

  const saveVideo = (v) => run(() => api(`${base}/videos`, { method: "POST", body: v }), "Video saved.");
  const removeVideo = (v) => window.confirm(`Remove "${v.title}" from the campaign?`) && run(() => api(`${base}/videos?id=${v.id}`, { method: "DELETE" }));

  async function remove() {
    if (!window.confirm(`Delete the campaign "${campaign.name}" with all its numbers? This cannot be undone.`)) return;
    try {
      await api(base, { method: "DELETE" });
      window.location.href = `/adminhub/clients/${clientId}`;
    } catch (e) {
      setError(e.message);
    }
  }

  if (!campaign) return error ? <p className="note bad" role="alert">{error}</p> : <p className="muted">Loading campaign…</p>;

  return (
    <>
      <header className="hub-head hero" style={{ "--art": "url(/brand/bg-hero-portal.jpg)" }}>
        <div>
          <Link className="tag" href={`/adminhub/clients/${clientId}`}>← {campaign.client}_</Link>
          <h1>{campaign.name}</h1>
          <p className="lede">The client sees this report in their portal and can download it as a PDF.</p>
        </div>
      </header>

      {error && <p className="note bad" role="alert" style={{ marginBottom: 16 }}>{error}</p>}
      {saved && <p className="note ok" role="status" style={{ marginBottom: 16 }}>{saved}</p>}

      <div className="stack" style={{ gap: 18 }}>
        <form
          className="panel stack"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => api(`/clients/${clientId}/campaigns`, { method: "POST", body: { ...meta, id: campaign.id, highlights: fromText(meta.highlights) } }), "Campaign saved.");
          }}
        >
          <h2>Campaign</h2>
          <div className="cmp-video-head" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }}>
            <label className="lbl">
              Name
              <input className="field" required value={meta.name} onChange={(e) => setMeta({ ...meta, name: e.target.value })} />
            </label>
            <label className="lbl">
              Brand
              <input className="field" placeholder="e.g. NVIDIA" value={meta.brand} onChange={(e) => setMeta({ ...meta, brand: e.target.value })} />
            </label>
            <label className="lbl">
              Starts
              <input className="field" type="date" value={meta.starts} onChange={(e) => setMeta({ ...meta, starts: e.target.value })} />
            </label>
            <label className="lbl">
              Ends
              <input className="field" type="date" value={meta.ends} onChange={(e) => setMeta({ ...meta, ends: e.target.value })} />
            </label>
          </div>
          <label className="lbl">
            Summary for the client
            <textarea className="field" rows={3} value={meta.summary} onChange={(e) => setMeta({ ...meta, summary: e.target.value })} placeholder="What ran, where, and what came out of it." />
          </label>
          <label className="lbl">
            Channel highlights, one per line as Label: value
            <textarea className="field" rows={3} value={meta.highlights} onChange={(e) => setMeta({ ...meta, highlights: e.target.value })} placeholder={"YouTube views, last 28 days: 195.3K\nYouTube watch time, last 28 days: 14.3K hours"} />
          </label>
          <div className="row">
            <button className="btn primary" type="submit">Save campaign</button>
            <button className="btn quiet danger" type="button" onClick={remove}>Delete campaign</button>
          </div>
        </form>

        <section className="panel stack">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h2>Videos</h2>
            {!adding && <button className="btn" type="button" onClick={() => setAdding(true)}>Add video</button>}
          </div>
          <p className="muted">Type the numbers as the apps show them: 40.6K, 2,654, 58.2%, 141h:07m all work. Leave out what a platform does not show.</p>
          {campaign.videos.map((v) => <Video key={v.id} video={v} onSave={saveVideo} onDelete={removeVideo} />)}
          {adding && (
            <Video
              video={{ title: "", posted_on: "", length_s: "", stats: { tiktok: {} } }}
              onSave={async (v) => (await saveVideo(v)) && setAdding(false)}
            />
          )}
        </section>

        <section className="stack">
          <span className="tag">Client_view</span>
          <CampaignReport campaign={campaign} pdfHref={`/adminhub/clients/${clientId}/campaigns/${campaignId}/pdf`} />
        </section>
      </div>
    </>
  );
}
