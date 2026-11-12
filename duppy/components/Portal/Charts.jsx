"use client";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const PLATFORMS = [
  { key: "tiktok", label: "TikTok", color: "#00fffc" },
  { key: "instagram", label: "Instagram", color: "#ff5fa2" },
  { key: "youtube", label: "YouTube", color: "#8efc09" },
];

export function compact(n) {
  if (n == null) return "–";
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${+(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${+(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${+(n / 1e3).toFixed(1)}K`;
  return String(n);
}

export const shortDate = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

// rows: [{week, platform, followers, views}] -> one point per week
function series(rows, metric) {
  const weeks = new Map();
  for (const r of rows) {
    if (!weeks.has(r.week)) weeks.set(r.week, { week: r.week });
    if (r[metric] != null) weeks.get(r.week)[r.platform] = r[metric];
  }
  return [...weeks.values()].sort((a, b) => a.week.localeCompare(b.week));
}

function Chart({ title, data, platforms }) {
  return (
    <figure className="glass hub-chart">
      <figcaption className="row" style={{ justifyContent: "space-between" }}>
        <h3>{title}</h3>
        <span className="row" style={{ gap: 14 }}>
          {platforms.map((p) => (
            <span key={p.key} className="legend">
              <i style={{ background: p.color }} />
              {p.label}
            </span>
          ))}
        </span>
      </figcaption>
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#2c2c2c" vertical={false} />
            <XAxis dataKey="week" tickFormatter={shortDate} stroke="#a3a3a3" tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#2c2c2c" }} />
            <YAxis tickFormatter={compact} stroke="#a3a3a3" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={48} />
            <Tooltip
              formatter={(value, key) => [compact(value), platforms.find((p) => p.key === key)?.label || key]}
              labelFormatter={(week) => `Week of ${shortDate(week)}`}
              contentStyle={{ background: "#181818", border: "1px solid #333", borderRadius: 12, color: "#f7f7f7" }}
              cursor={{ stroke: "#555" }}
            />
            {platforms.map((p) => (
              <Line key={p.key} type="monotone" dataKey={p.key} stroke={p.color} strokeWidth={2} dot={{ r: 3, fill: p.color }} activeDot={{ r: 5 }} connectNulls isAnimationActive={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

// Latest number per platform, with the change against the week before.
function Tiles({ rows, platforms }) {
  return (
    <div className="hub-tiles">
      {platforms.map((p) => {
        const mine = rows.filter((r) => r.platform === p.key).sort((a, b) => a.week.localeCompare(b.week));
        const last = mine[mine.length - 1];
        const prev = mine[mine.length - 2];
        const delta = last?.followers != null && prev?.followers != null ? last.followers - prev.followers : null;
        return (
          <div className="glass hub-tile" key={p.key}>
            <span className="tag" style={{ color: p.color }}>{p.label}</span>
            <b>{compact(last?.followers)}</b>
            <span className="small muted">
              followers
              {delta != null && (
                <span style={{ color: delta >= 0 ? "var(--energy)" : "var(--danger)" }}>
                  {" "}· {delta >= 0 ? "+" : "−"}{compact(Math.abs(delta))} this week
                </span>
              )}
            </span>
            <span className="small muted">{compact(last?.views)} views this week</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Charts({ stats }) {
  const used = PLATFORMS.filter((p) => stats.some((r) => r.platform === p.key));
  if (!used.length) return <p className="muted">No numbers yet. They appear here after the first weekly update.</p>;
  return (
    <div className="stack">
      <Tiles rows={stats} platforms={used} />
      <Chart title="Followers" data={series(stats, "followers")} platforms={used} />
      <Chart title="Weekly views" data={series(stats, "views")} platforms={used} />
    </div>
  );
}
