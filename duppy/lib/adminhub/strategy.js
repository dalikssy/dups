import { sql, getSetting, setSetting, deleteSetting } from "./db";
import { HttpError } from "./errors";
import { adviseStrategy } from "./claude";

const DAY = 24 * 60 * 60 * 1000;
const OWN = (process.env.GMAIL_SENDER || "info@dupscaled.com").toLowerCase();
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const rate = (part, whole) => (whole ? Math.round((part / whole) * 100) : null);

// Sent / replied / bounced for a set of emails, with the reply rate in percent.
function tally(rows) {
  const sent = rows.length;
  const replied = rows.filter((r) => r.replied).length;
  return { sent, replied, reply_rate_pct: rate(replied, sent), bounced: rows.filter((r) => r.bounced).length };
}

function groupBy(rows, key) {
  const groups = {};
  for (const row of rows) (groups[key(row) ?? "unknown"] ||= []).push(row);
  return Object.fromEntries(Object.entries(groups).map(([name, items]) => [name, tally(items)]));
}

// Everything known about first emails sent in the last five weeks, shaped for
// the review: last week's numbers, the four weeks before, and the emails.
export async function collect(now = new Date()) {
  const since = new Date(now.getTime() - 35 * DAY);
  const rows = await sql`
    select l.name, l.category, l.segment, l.market, l.language, l.status, l.replied_at,
           d.subject, d.body, d.sent_at,
           a.slug is not null as has_audit, coalesce(a.views, 0) as audit_views,
           (select count(*)::int from hub_drafts f where f.lead_id = l.id and f.kind <> 'initial' and f.status = 'sent') as followups_sent
    from hub_drafts d
    join hub_leads l on l.id = d.lead_id
    left join hub_audits a on a.lead_id = l.id
    where d.kind = 'initial' and d.status = 'sent' and d.sent_at >= ${since}
      and lower(l.email) <> ${OWN} -- test emails sent to our own mailbox
    order by d.sent_at desc`;

  const emails = rows.map((r) => {
    const sent = new Date(r.sent_at);
    return {
      target: r.name,
      type: r.category,
      segment: r.segment,
      market: r.market,
      language: r.language,
      sent_on: `${WEEKDAYS[sent.getUTCDay()]} ${sent.toISOString().slice(0, 10)}`,
      age_days: Math.floor((now - sent) / DAY),
      replied: Boolean(r.replied_at) || ["replied", "call", "closed"].includes(r.status),
      bounced: r.status === "bounced",
      outcome: r.status,
      has_audit: r.has_audit,
      audit_opened: r.audit_views > 0,
      audit_views: r.audit_views,
      followups_sent: r.followups_sent,
      subject: r.subject,
      words: r.body.split(/\s+/).filter(Boolean).length,
      mentions_audit_in_first_two_sentences: /audit/i.test(r.body.split(/(?<=[.!?])\s+/).slice(0, 3).join(" ")),
      body: r.body.slice(0, 1200),
    };
  });

  const week = emails.filter((e) => e.age_days < 7);
  const before = emails.filter((e) => e.age_days >= 7);
  const audited = week.filter((e) => e.has_audit);

  return {
    period: { last_week_from: new Date(now.getTime() - 7 * DAY).toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) },
    last_week: {
      ...tally(week),
      with_audit: tally(audited),
      without_audit: tally(week.filter((e) => !e.has_audit)),
      audits_sent: audited.length,
      audits_opened: audited.filter((e) => e.audit_opened).length,
      audit_open_rate_pct: rate(audited.filter((e) => e.audit_opened).length, audited.length),
      by_language: groupBy(week, (e) => e.language),
      by_type: groupBy(week, (e) => e.type),
      by_weekday_sent: groupBy(week, (e) => e.sent_on.slice(0, 3)),
    },
    previous_four_weeks: { ...tally(before), with_audit: tally(before.filter((e) => e.has_audit)), without_audit: tally(before.filter((e) => !e.has_audit)) },
    note: "Replies to emails sent in the last few days may still arrive, so recent emails without a reply are not yet failures.",
    emails: emails.slice(0, 40),
  };
}

// Runs the review. Costs one model call and nothing is searched on the web.
export async function review() {
  const data = await collect();
  if (!data.emails.length) {
    throw new HttpError(400, "No sent emails in the last five weeks yet. Send a batch first, then check back.");
  }
  const advice = await adviseStrategy(data);
  return { numbers: { last_week: data.last_week, previous_four_weeks: data.previous_four_weeks }, advice };
}

// The guidance the email writer receives with every new draft.
export async function activeGuidance() {
  return (await getSetting("strategy")) || null;
}

export async function saveGuidance(text, user) {
  const guidance = typeof text === "string" ? text.trim().slice(0, 2000) : "";
  if (!guidance) throw new HttpError(400, "There is no guidance to save.");
  await setSetting("strategy", { guidance, saved_by: user.email, saved_at: new Date().toISOString() });
}

export async function clearGuidance() {
  await deleteSetting("strategy");
}
