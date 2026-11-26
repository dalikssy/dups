// Shared by the hub, the client portal and the campaign PDF: which numbers a
// campaign video can carry per platform, and how a campaign adds up.

export const CAMPAIGN_PLATFORMS = [
  { key: "tiktok", label: "TikTok", color: "#00fffc" },
  { key: "youtube", label: "YouTube", color: "#8efc09" },
  { key: "instagram", label: "Instagram", color: "#ff5fa2" },
];

// sum: added up across videos; the rest are averages weighted by views.
export const FIELDS = [
  { key: "views", label: "Views", sum: true },
  { key: "likes", label: "Likes", sum: true },
  { key: "comments", label: "Comments", sum: true },
  { key: "shares", label: "Shares", sum: true },
  { key: "saves", label: "Saves", sum: true },
  { key: "new_followers", label: "New followers", sum: true },
  { key: "play_time_h", label: "Watch time", unit: "h", sum: true },
  { key: "avg_watch_s", label: "Avg. watch time", unit: "s" },
  { key: "avg_viewed_pct", label: "Avg. % viewed", unit: "%" },
  { key: "full_pct", label: "Watched full video", unit: "%" },
];

export const ENGAGEMENT = [
  { key: "likes", label: "Likes", color: "#ff5fa2" },
  { key: "comments", label: "Comments", color: "#ffc94d" },
  { key: "shares", label: "Shares", color: "#00fffc" },
  { key: "saves", label: "Saves", color: "#8efc09" },
];

export const platformOf = (key) => CAMPAIGN_PLATFORMS.find((p) => p.key === key);

export function compact(n) {
  if (n == null || Number.isNaN(n)) return "–";
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${+(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${+(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e4) return `${+(n / 1e3).toFixed(1)}K`;
  return Math.round(n).toLocaleString("en-GB");
}

export function hours(h) {
  if (h == null) return "–";
  if (h >= 100) return `${Math.round(h).toLocaleString("en-GB")} h`;
  const whole = Math.floor(h);
  return `${whole}h ${String(Math.round((h - whole) * 60)).padStart(2, "0")}m`;
}

export const percent = (n, digits = 1) => (n == null ? "–" : `${n.toFixed(digits)}%`);

export function formatField(field, value) {
  if (value == null) return "–";
  if (field.unit === "h") return hours(value);
  if (field.unit === "%") return `${+value.toFixed(2)}%`;
  if (field.unit === "s") return `${value.toFixed(1)}s`;
  return compact(value);
}

// Totals for the whole campaign, or for one platform when platform is set.
export function summarize(videos, platform = "all") {
  const totals = Object.fromEntries(FIELDS.filter((f) => f.sum).map((f) => [f.key, 0]));
  const byPlatform = {};
  const weighted = { avg_watch_s: [0, 0], avg_viewed_pct: [0, 0], full_pct: [0, 0] };

  for (const video of videos || []) {
    for (const [key, stats] of Object.entries(video.stats || {})) {
      if (platform !== "all" && key !== platform) continue;
      const mine = (byPlatform[key] ||= Object.fromEntries(Object.keys(totals).map((k) => [k, 0])));
      for (const k of Object.keys(totals)) {
        totals[k] += stats[k] || 0;
        mine[k] += stats[k] || 0;
      }
      for (const k of Object.keys(weighted)) {
        if (stats[k] != null && stats.views) {
          weighted[k][0] += stats[k] * stats.views;
          weighted[k][1] += stats.views;
        }
      }
    }
  }

  const interactions = totals.likes + totals.comments + totals.shares + totals.saves;
  const avg = (k) => (weighted[k][1] ? weighted[k][0] / weighted[k][1] : null);
  return {
    totals,
    byPlatform,
    interactions,
    engagement: totals.views ? (interactions / totals.views) * 100 : null,
    avgWatch: avg("avg_watch_s"),
    avgViewed: avg("avg_viewed_pct"),
    fullPct: avg("full_pct"),
  };
}

// "Me on YOUR setup 😭" -> "Me on YOUR setup": the PDF fonts have no emoji.
export const plainText = (text) =>
  String(text ?? "")
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
