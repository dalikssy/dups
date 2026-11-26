import { sql } from "./db";
import { HttpError } from "./errors";
import { CAMPAIGN_PLATFORMS, FIELDS } from "../campaignFields";

// Campaign reports for clients: each campaign holds the videos that ran in it,
// with numbers per platform typed in from the platforms' own analytics.

const PLATFORM_KEYS = CAMPAIGN_PLATFORMS.map((p) => p.key);
const isDate = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
const clip = (value, max) => String(value ?? "").trim().slice(0, max) || null;

// Accepts what the analytics screens show: "40.6K", "2,654", "58.2%",
// "12.2s", "141h:07m". Returns null for an empty value.
export function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  let s = String(value).trim().toLowerCase().replace(/\s+/g, "");
  if (!s) return null;
  const time = s.match(/^(\d+(?:\.\d+)?)h:?(\d{1,2})m?$/);
  if (time) return Number(time[1]) + Number(time[2]) / 60;
  s = s.replace(/[%sh]$/, "");
  // "2,654" is a thousands separator, "12,2" a decimal comma
  s = /,\d{3}(?!\d)/.test(s) ? s.replace(/,/g, "") : s.replace(",", ".");
  const unit = { k: 1e3, m: 1e6, b: 1e9 }[s.slice(-1)];
  const n = Number(unit ? s.slice(0, -1) : s) * (unit || 1);
  return Number.isFinite(n) ? n : NaN;
}

function cleanStats(input) {
  const stats = {};
  for (const platform of PLATFORM_KEYS) {
    const src = input?.[platform];
    if (!src || typeof src !== "object") continue;
    const row = {};
    for (const field of FIELDS) {
      const n = toNumber(src[field.key]);
      if (n === null) continue;
      const label = `${CAMPAIGN_PLATFORMS.find((p) => p.key === platform).label} ${field.label.toLowerCase()}`;
      if (Number.isNaN(n) || n < 0 || n > 1e12 || (field.unit === "%" && n > 100)) {
        throw new HttpError(400, `Check the number for ${label}.`);
      }
      row[field.key] = Math.round(n * 100) / 100;
    }
    const title = clip(src.title, 200);
    if (title) row.title = title;
    const url = clip(src.url, 500);
    if (url && /^https:\/\//i.test(url)) row.url = url;
    if (Object.keys(row).length) stats[platform] = row;
  }
  return stats;
}

function cleanHighlights(input) {
  return (Array.isArray(input) ? input : [])
    .slice(0, 12)
    .map((h) => ({ label: clip(h?.label, 80), value: clip(h?.value, 60) }))
    .filter((h) => h.label && h.value);
}

export async function listCampaigns(clientId) {
  return sql`
    select c.id, c.name, c.brand, to_char(c.starts, 'YYYY-MM-DD') as starts, to_char(c.ends, 'YYYY-MM-DD') as ends,
           count(v.id)::int as videos,
           coalesce(sum((select coalesce(sum((value->>'views')::float8), 0) from jsonb_each(v.stats))), 0)::float8 as views
    from hub_campaigns c left join hub_campaign_videos v on v.campaign_id = c.id
    where c.client_id = ${clientId}
    group by c.id order by coalesce(c.starts, c.created_at::date) desc, c.id desc`;
}

// One campaign of one client. Always looked up together with the client id,
// so a client can only ever load their own campaigns.
export async function getCampaign(clientId, id) {
  const rows = await sql`
    select c.id, c.name, c.brand, c.summary, c.highlights, to_char(c.starts, 'YYYY-MM-DD') as starts,
           to_char(c.ends, 'YYYY-MM-DD') as ends, c.updated_at, k.name as client
    from hub_campaigns c join hub_clients k on k.id = c.client_id
    where c.id = ${id} and c.client_id = ${clientId}`;
  if (!rows[0]) throw new HttpError(404, "Campaign not found.");
  const videos = await sql`
    select id, title, to_char(posted_on, 'YYYY-MM-DD') as posted_on, length_s::float8 as length_s, stats
    from hub_campaign_videos where campaign_id = ${id} order by posted_on nulls last, id`;
  return { ...rows[0], videos };
}

export async function saveCampaign(clientId, input) {
  const name = clip(input?.name, 160);
  if (!name) throw new HttpError(400, "Give the campaign a name.");
  const brand = clip(input?.brand, 120);
  const summary = clip(input?.summary, 4000);
  const starts = isDate(input?.starts) ? input.starts : null;
  const ends = isDate(input?.ends) ? input.ends : null;
  const highlights = JSON.stringify(cleanHighlights(input?.highlights));

  if (input?.id) {
    const rows = await sql`
      update hub_campaigns set name = ${name}, brand = ${brand}, summary = ${summary}, starts = ${starts}, ends = ${ends},
        highlights = ${highlights}::jsonb, updated_at = now()
      where id = ${Number(input.id)} and client_id = ${clientId} returning id`;
    if (!rows[0]) throw new HttpError(404, "Campaign not found.");
    return { id: rows[0].id };
  }
  const client = (await sql`select id from hub_clients where id = ${clientId}`)[0];
  if (!client) throw new HttpError(404, "Client not found.");
  const rows = await sql`
    insert into hub_campaigns (client_id, name, brand, summary, starts, ends, highlights)
    values (${clientId}, ${name}, ${brand}, ${summary}, ${starts}, ${ends}, ${highlights}::jsonb) returning id`;
  return { id: rows[0].id };
}

export async function deleteCampaign(clientId, id) {
  await sql`delete from hub_campaigns where id = ${id} and client_id = ${clientId}`;
}

async function ownCampaign(clientId, campaignId) {
  const rows = await sql`select id from hub_campaigns where id = ${campaignId} and client_id = ${clientId}`;
  if (!rows[0]) throw new HttpError(404, "Campaign not found.");
}

export async function saveVideo(clientId, campaignId, input) {
  await ownCampaign(clientId, campaignId);
  const title = clip(input?.title, 200);
  if (!title) throw new HttpError(400, "Give the video a title.");
  const postedOn = isDate(input?.posted_on) ? input.posted_on : null;
  const length = toNumber(input?.length_s);
  if (Number.isNaN(length) || length < 0 || length > 86400) throw new HttpError(400, "Check the video length.");
  const stats = JSON.stringify(cleanStats(input?.stats));

  if (input?.id) {
    const rows = await sql`
      update hub_campaign_videos set title = ${title}, posted_on = ${postedOn}, length_s = ${length}, stats = ${stats}::jsonb
      where id = ${Number(input.id)} and campaign_id = ${campaignId} returning id`;
    if (!rows[0]) throw new HttpError(404, "Video not found.");
  } else {
    await sql`
      insert into hub_campaign_videos (campaign_id, title, posted_on, length_s, stats)
      values (${campaignId}, ${title}, ${postedOn}, ${length}, ${stats}::jsonb)`;
  }
  await sql`update hub_campaigns set updated_at = now() where id = ${campaignId}`;
}

export async function deleteVideo(clientId, campaignId, id) {
  await ownCampaign(clientId, campaignId);
  await sql`delete from hub_campaign_videos where id = ${id} and campaign_id = ${campaignId}`;
}
