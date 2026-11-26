"use client";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  CAMPAIGN_PLATFORMS,
  ENGAGEMENT,
  FIELDS,
  compact,
  formatField,
  hours,
  percent,
  platformOf,
  summarize,
} from "@/lib/campaignFields";

const day = (iso) =>
  iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "";
const short = (title, n = 22) => (title.length > n ? `${title.slice(0, n - 1).trim()}…` : title);
const TOOLTIP = { background: "#121212", border: "1px solid #333", borderRadius: 12, color: "#f7f7f7", fontSize: 13 };

// Counts up to the value when it first shows or changes.
function useCount(target) {
  const [n, setN] = useState(target || 0);
  useEffect(() => {
    if (target == null) return undefined;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setN(target);
      return undefined;
    }
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / 800, 1);
      setN(target * (1 - (1 - t) ** 3));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return n;
}

function Kpi({ label, value, format, color, sub }) {
  const n = useCount(value);
  return (
    <div className="glass cmp-kpi" style={{ "--c": color }}>
      <span className="tag">{label}</span>
      <b>{value == null ? "–" : format(n)}</b>
      {sub && <span className="small muted">{sub}</span>}
    </div>
  );
}

function Meter({ value, max = 100, color, label, note }) {
  const width = value == null ? 0 : Math.max(2, Math.min(100, (value / max) * 100));
  return (
    <div className="cmp-meter">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="small">{label}</span>
        <b className="small">{note}</b>
      </div>
      <span className="cmp-track"><i style={{ width: `${width}%`, background: color }} /></span>
    </div>
  );
}

export default function CampaignReport({ campaign, pdfHref }) {
  const videos = campaign.videos || [];
  const used = CAMPAIGN_PLATFORMS.filter((p) => videos.some((v) => v.stats?.[p.key]));
  const [platform, setPlatform] = useState("all");
  const [selected, setSelected] = useState(videos[0]?.id ?? null);
  const shown = platform === "all" ? used : used.filter((p) => p.key === platform);

  const sum = useMemo(() => summarize(videos, platform), [videos, platform]);
  const perVideo = videos.map((v) => ({
    id: v.id,
    name: short(v.title),
    title: v.title,
    ...Object.fromEntries(shown.map((p) => [p.key, v.stats?.[p.key]?.views ?? 0])),
  }));
  const mix = ENGAGEMENT.map((e) => ({ ...e, value: sum.totals[e.key] })).filter((e) => e.value > 0);
  const video = videos.find((v) => v.id === selected) || videos[0];
  const split = summarize(videos).byPlatform;
  const allViews = Object.values(split).reduce((t, p) => t + p.views, 0);

  if (!videos.length) {
    return <p className="muted">No videos in this campaign yet.</p>;
  }

  return (
    <div className="cmp stack" style={{ gap: 18 }}>
      <div className="row cmp-bar">
        <div className="row cmp-chips" role="group" aria-label="Platform">
          {[{ key: "all", label: "All platforms", color: "#f7f7f7" }, ...used].map((p) => (
            <button
              key={p.key}
              type="button"
              className={`cmp-chip ${platform === p.key ? "on" : ""}`}
              style={{ "--c": p.color }}
              aria-pressed={platform === p.key}
              onClick={() => setPlatform(p.key)}
            >
              {p.key !== "all" && <i />}
              {p.label}
            </button>
          ))}
        </div>
        {pdfHref && (
          <a className="btn primary" href={pdfHref}>
            Download PDF
          </a>
        )}
      </div>

      <div className="cmp-kpis">
        <Kpi label="Views" value={sum.totals.views} format={compact} color="#00fffc" sub={`${videos.length} videos`} />
        <Kpi label="Likes" value={sum.totals.likes} format={compact} color="#ff5fa2" />
        <Kpi label="Engagement rate" value={sum.engagement} format={(n) => percent(n, 2)} color="#ffc94d" sub={`${compact(sum.interactions)} interactions`} />
        <Kpi label="New followers" value={sum.totals.new_followers || null} format={compact} color="#8efc09" />
        <Kpi label="Watch time" value={sum.totals.play_time_h || null} format={hours} color="#b48cff" />
        <Kpi label="Shares + saves" value={sum.totals.shares + sum.totals.saves || null} format={compact} color="#ff9f43" />
      </div>

      {platform === "all" && used.length > 1 && (
        <figure className="glass hub-chart">
          <figcaption><h3>Views by platform</h3></figcaption>
          <div className="cmp-split" role="img" aria-label="Share of views by platform">
            {used.map((p) => (
              <i key={p.key} style={{ flexGrow: split[p.key]?.views || 0, background: p.color }} title={`${p.label}: ${compact(split[p.key]?.views)}`} />
            ))}
          </div>
          <div className="row" style={{ gap: 22 }}>
            {used.map((p) => (
              <button key={p.key} type="button" className="cmp-legend" onClick={() => setPlatform(p.key)}>
                <i style={{ background: p.color }} />
                {p.label} <b>{compact(split[p.key]?.views)}</b>
                <span className="muted">{allViews ? Math.round(((split[p.key]?.views || 0) / allViews) * 100) : 0}%</span>
              </button>
            ))}
          </div>
        </figure>
      )}

      <div className="cmp-grid">
        <figure className="glass hub-chart">
          <figcaption className="row" style={{ justifyContent: "space-between" }}>
            <h3>Views per video</h3>
            <span className="small muted">Click a bar for details</span>
          </figcaption>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={perVideo}
                margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                barCategoryGap="26%"
                style={{ cursor: "pointer" }}
                onClick={(state) => {
                  // a click anywhere in a video's column selects it
                  const row = perVideo[Number(state?.activeTooltipIndex ?? state?.activeIndex)];
                  if (row) setSelected(row.id);
                }}
              >
                <CartesianGrid stroke="#2c2c2c" vertical={false} />
                <XAxis dataKey="name" stroke="#a3a3a3" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#2c2c2c" }} interval={0} />
                <YAxis tickFormatter={compact} stroke="#a3a3a3" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={48} />
                <Tooltip
                  contentStyle={TOOLTIP}
                  cursor={{ fill: "rgb(255 255 255 / 0.05)" }}
                  labelFormatter={(_, items) => items?.[0]?.payload?.title || ""}
                  formatter={(value, key) => [compact(value), platformOf(key)?.label || key]}
                />
                {shown.map((p, i) => (
                  <Bar
                    key={p.key}
                    dataKey={p.key}
                    stackId="views"
                    fill={p.color}
                    radius={i === shown.length - 1 ? [8, 8, 0, 0] : 0}
                    isAnimationActive={false}
                    cursor="pointer"
                    onClick={(d) => setSelected(d?.payload?.id ?? d?.id)}
                  >
                    {perVideo.map((row) => (
                      <Cell key={row.id} fillOpacity={row.id === video?.id ? 1 : 0.45} />
                    ))}
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </figure>

        <figure className="glass hub-chart">
          <figcaption><h3>Engagement mix</h3></figcaption>
          <div className="cmp-donut">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={mix} dataKey="value" nameKey="label" innerRadius="62%" outerRadius="92%" paddingAngle={2} stroke="none" isAnimationActive={false}>
                  {mix.map((e) => <Cell key={e.key} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP} formatter={(value, name) => [compact(value), name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="cmp-donut-mid">
              <b>{percent(sum.engagement, 2)}</b>
              <span className="tag dim">engagement</span>
            </div>
          </div>
          <div className="cmp-mix">
            {mix.map((e) => (
              <span key={e.key}>
                <i style={{ background: e.color }} />
                {e.label} <b>{compact(e.value)}</b>
              </span>
            ))}
          </div>
        </figure>
      </div>

      <section className="glass hub-chart">
        <h3>How long people watched</h3>
        <div className="cmp-retention">
          {videos.map((v) => (
            <button key={v.id} type="button" className={`cmp-ret ${v.id === video?.id ? "on" : ""}`} onClick={() => setSelected(v.id)}>
              <b className="small">{v.title}</b>
              {shown.map((p) => {
                const s = v.stats?.[p.key];
                if (!s) return null;
                if (s.avg_viewed_pct != null) {
                  return <Meter key={p.key} color={p.color} label={`${p.label} · avg. viewed`} value={s.avg_viewed_pct} note={percent(s.avg_viewed_pct)} />;
                }
                if (s.avg_watch_s != null && v.length_s) {
                  const pct = (s.avg_watch_s / v.length_s) * 100;
                  return <Meter key={p.key} color={p.color} label={`${p.label} · ${s.avg_watch_s.toFixed(1)}s of ${v.length_s.toFixed(0)}s`} value={pct} note={percent(pct)} />;
                }
                return null;
              })}
            </button>
          ))}
        </div>
      </section>

      {video && (
        <section className="glass hub-chart">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="stack" style={{ gap: 4 }}>
              <span className="tag">Video_</span>
              <h3>{video.title}</h3>
              <span className="small muted">
                {[video.posted_on && `Posted ${day(video.posted_on)}`, video.length_s && `${video.length_s.toFixed(0)}s`].filter(Boolean).join(" · ")}
              </span>
            </div>
            <div className="row cmp-chips">
              {videos.map((v, i) => (
                <button key={v.id} type="button" className={`cmp-chip ${v.id === video.id ? "on" : ""}`} onClick={() => setSelected(v.id)} aria-pressed={v.id === video.id}>
                  {String(i + 1).padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>
          <div className="cmp-detail">
            {used.filter((p) => video.stats?.[p.key]).map((p) => {
              const s = video.stats[p.key];
              return (
                <div key={p.key} className="cmp-plat" style={{ "--c": p.color }}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <span className="tag">{p.label}</span>
                    {s.url && <a className="link small" href={s.url} target="_blank" rel="noreferrer">Open</a>}
                  </div>
                  {s.title && s.title !== video.title && <span className="small muted">“{s.title}”</span>}
                  <dl>
                    {FIELDS.filter((f) => s[f.key] != null).map((f) => (
                      <div key={f.key}>
                        <dt>{f.label}</dt>
                        <dd>{formatField(f, s[f.key])}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {campaign.highlights?.length > 0 && (
        <section className="stack">
          <h3>Channel highlights</h3>
          <div className="cmp-kpis two">
            {campaign.highlights.map((h, i) => (
              <div key={i} className="glass cmp-kpi" style={{ "--c": ["#8efc09", "#00fffc", "#ff5fa2", "#ffc94d"][i % 4] }}>
                <span className="tag">{h.label}</span>
                <b>{h.value}</b>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
