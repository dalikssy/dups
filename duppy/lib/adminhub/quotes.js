import { sql, getSetting, setSetting } from "./db";
import { HttpError } from "./errors";
import { httpUrl } from "./verify";
import { researchQuote } from "./claude";

export const CURRENCIES = ["EUR", "CZK", "USD", "GBP"];

// The agency's price list. Each service has the usual price and the range the
// estimate may move in; all of it is editable in the hub.
export const DEFAULT_PRICING = {
  currency: "EUR",
  services: [
    { key: "daily_shorts", name: "Daily shorts", unit: "month", min: 900, base: 1200, max: 1800 },
    { key: "thumbnail", name: "Thumbnail", unit: "piece", min: 90, base: 125, max: 175 },
    { key: "single_short", name: "Single short", unit: "piece", min: 40, base: 50, max: 80 },
    { key: "long_form", name: "Long-form video", unit: "piece", min: 150, base: 400, max: 750 },
  ],
};

const clip = (value, max) => (typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null);
const amount = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n < 1e7 ? Math.round(n) : null;
};
const round = (n) => Math.round(n * 100) / 100;

export async function getPricing() {
  return (await getSetting("pricing")) || DEFAULT_PRICING;
}

export async function savePricing(input) {
  const seen = new Set();
  const services = (Array.isArray(input?.services) ? input.services : [])
    .map((s) => {
      const name = clip(s?.name, 80);
      const base = amount(s?.base);
      if (!name || base === null) return null;
      // the range always contains the usual price
      const min = Math.min(amount(s?.min) ?? base, base);
      const max = Math.max(amount(s?.max) ?? base, base);
      let key = clip(s?.key, 40)?.toLowerCase().replace(/[^a-z0-9_]/g, "") || name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
      while (seen.has(key)) key += "_2";
      seen.add(key);
      return { key, name, unit: s?.unit === "month" ? "month" : "piece", min, base, max };
    })
    .filter(Boolean)
    .slice(0, 30);
  if (!services.length) throw new HttpError(400, "Keep at least one service on the price list.");
  const pricing = { currency: CURRENCIES.includes(input?.currency) ? input.currency : "EUR", services };
  await setSetting("pricing", pricing);
  return pricing;
}

const sum = (lines, field) => round(lines.reduce((total, l) => total + l.qty * l[field], 0));

// Researches the client and prices the requested services. The model proposes
// a price per unit; every price is forced back inside the allowed range here,
// and all sums are worked out here.
export async function createQuote(input, user, { emit, deadline }) {
  const url = httpUrl(input?.url);
  if (!url) throw new HttpError(400, "Paste a link to the client (their channel or site).");
  const pricing = await getPricing();
  const wanted = (Array.isArray(input?.services) ? input.services : [])
    .map((w) => {
      const service = pricing.services.find((s) => s.key === w?.key);
      if (!service) return null;
      // a monthly service is priced per month, so it has no quantity
      const qty = service.unit === "month" ? 1 : Math.min(Math.max(Math.round(Number(w?.qty) || 1), 1), 500);
      return { ...service, qty };
    })
    .filter(Boolean);
  if (!wanted.length) throw new HttpError(400, "Pick at least one service.");

  const estimate = await researchQuote({ url, services: wanted, currency: pricing.currency, notes: clip(input?.notes, 1000) }, { emit, deadline });
  if (!estimate) throw new HttpError(504, "The research ran out of time. Try again.");

  const lines = wanted.map((s) => {
    const proposed = estimate.lines.find((l) => l.key === s.key);
    const price = Math.round(Math.min(Math.max(Number(proposed?.price) || s.base, s.min), s.max));
    return { key: s.key, name: s.name, unit: s.unit, qty: s.qty, min: s.min, base: s.base, max: s.max, price, amount: round(s.qty * price), why: proposed?.why || "" };
  });
  const monthly = lines.filter((l) => l.unit === "month");
  const oneOff = lines.filter((l) => l.unit !== "month");

  const data = {
    currency: pricing.currency,
    lines,
    monthly_total: sum(monthly, "price"),
    one_off_total: sum(oneOff, "price"),
    floor_total: sum(lines, "min"),
    list_total: sum(lines, "base"),
    ceiling_total: sum(lines, "max"),
    reach: (estimate.reach || []).slice(0, 8),
    reach_summary: estimate.reach_summary,
    budget_tier: estimate.budget_tier,
    budget_estimate: estimate.budget_estimate,
    confidence: estimate.confidence,
    opening_note: estimate.opening_note,
    floor_note: estimate.floor_note,
    sources: (estimate.sources || []).map(httpUrl).filter(Boolean).slice(0, 10),
  };

  const client = clip(estimate.client_name, 200) || new URL(url).hostname;
  const rows = await sql`
    insert into hub_quotes (client, url, data, created_by)
    values (${client}, ${url}, ${JSON.stringify(data)}::jsonb, ${user.email})
    returning id, client, url, data, created_at`;
  return rows[0];
}

export async function listQuotes() {
  return sql`select id, client, url, data, created_at from hub_quotes order by created_at desc limit 50`;
}

export async function deleteQuote(id) {
  await sql`delete from hub_quotes where id = ${id}`;
}
