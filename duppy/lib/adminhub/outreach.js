import { sql, getSetting } from "./db";
import { HttpError } from "./errors";
import { verifyEmail, httpUrl } from "./verify";
import { randomBytes } from "node:crypto";
import { writeDraft, writeFollowup, researchAudit } from "./claude";
import * as gmail from "./gmail";

// Pipeline order. "new" and "drafted" are the stages before first contact;
// "cold", "bounced" and "lost" are the ways a lead leaves the pipeline.
export const STATUSES = ["new", "drafted", "contacted", "replied", "call", "closed", "cold", "bounced", "lost"];

const DAY = 24 * 60 * 60 * 1000;
export const FOLLOWUP_1_AFTER = 4 * DAY; // since the first email was sent
export const FOLLOWUP_2_AFTER = 10 * DAY; // since the first email was sent
export const COLD_AFTER = 7 * DAY; // since the second follow-up was sent
const FOLLOWUPS_PER_RUN = 8; // keeps one sync run inside the function time limit

export async function listLeads() {
  const leads = await sql`select * from hub_leads order by updated_at desc`;
  const drafts = await sql`select * from hub_drafts order by created_at`;
  const audits = await sql`select lead_id, slug, views, created_at, first_viewed_at, last_viewed_at from hub_audits`;
  const auditOf = new Map(audits.map((a) => [a.lead_id, a]));
  const byLead = new Map();
  for (const d of drafts) {
    if (!byLead.has(d.lead_id)) byLead.set(d.lead_id, []);
    byLead.get(d.lead_id).push(d);
  }
  return leads.map((l) => ({ ...l, drafts: byLead.get(l.id) || [], audit: auditOf.get(l.id) || null }));
}

const clip = (value, max) => (typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null);

// Everything here may come from the model or a form, so it is cut to size and
// links are kept only if they are plain http(s).
async function insertLead(lead, user) {
  const rows = await sql`
    insert into hub_leads (name, category, segment, market, language, email, email_source_url, email_verified, website, hook, created_by)
    values (${clip(lead.name, 200)}, ${clip(lead.category, 40)}, ${clip(lead.segment, 1000)}, ${clip(lead.market, 200)},
            ${lead.language === "cs" ? "cs" : "en"}, ${clip(lead.email, 254)}, ${httpUrl(lead.source_url)},
            ${Boolean(lead.verified)}, ${httpUrl(lead.website)}, ${clip(lead.hook, 2000)}, ${user.email})
    on conflict (lower(email)) do nothing
    returning *`;
  return rows[0] || null;
}

// Called by the lead finder for every candidate the model wants to save.
export async function saveFoundLead(input, { segment, market, user }) {
  const check = await verifyEmail(input.email, input.source_url);
  // Only a bad source is refused outright. A page that loads but does not show
  // the address in its HTML is often rendered by scripts, so the lead is kept
  // and flagged: nobody can draft to it until a person has checked the email.
  if (check.rejected) {
    return { saved: false, message: `Not saved. ${check.reason} Give the exact official page that shows the address, or drop this target.` };
  }
  const lead = await insertLead({ ...input, segment, market, verified: check.verified === true }, user);
  if (!lead) return { saved: false, message: "Not saved: this email is already in the pipeline. Find a different target." };
  return {
    saved: true,
    lead,
    message: check.verified
      ? "Saved and verified."
      : `Saved, flagged for a manual check (${check.reason}). Where you can, prefer pages that print the address in plain text.`,
  };
}

export async function addLead(input, user) {
  if (typeof input?.name !== "string" || !input.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email || "")) {
    throw new HttpError(400, "Name and a valid email are required.");
  }
  // A person typing the address in vouches for it.
  const lead = await insertLead({ ...input, verified: true }, user);
  if (!lead) throw new HttpError(409, "This email is already in the pipeline.");
  return lead;
}

async function getLead(id) {
  const rows = await sql`select * from hub_leads where id = ${id}`;
  if (!rows[0]) throw new HttpError(404, "Lead not found.");
  return rows[0];
}

export async function generateDraft(leadId, user) {
  const lead = await getLead(leadId);
  if (!lead.email_verified) throw new HttpError(400, "Verify this lead's email before drafting.");
  const existing = await sql`select * from hub_drafts where lead_id = ${leadId} and kind = 'initial'`;
  if (existing[0] && existing[0].status !== "local") {
    throw new HttpError(400, "This draft is already in Gmail. Edit it there.");
  }
  const recent = await sql`select subject from hub_drafts where kind = 'initial' order by created_at desc limit 20`;
  const audits = await sql`select slug, data from hub_audits where lead_id = ${leadId}`;
  // with an audit on file the email is written around it
  const audit = audits[0]
    ? {
        url: auditUrl(audits[0].slug),
        headline: audits[0].data.headline,
        gaps: (audits[0].data.gaps || []).map((g) => g.title).slice(0, 4),
        clips: (audits[0].data.clip_ideas || []).map((c) => c.title).slice(0, 5),
      }
    : null;
  const strategy = await getSetting("strategy");
  const draft = await writeDraft(lead, recent.map((r) => r.subject), audit, strategy?.guidance || null);
  const rows = await sql`
    insert into hub_drafts (lead_id, kind, subject, body, created_by)
    values (${leadId}, 'initial', ${draft.subject}, ${draft.body}, ${user.email})
    on conflict (lead_id, kind) do update set subject = excluded.subject, body = excluded.body, created_at = now()
    returning *`;
  return rows[0];
}

export async function editDraft(id, { subject, body }) {
  const rows = await sql`select * from hub_drafts where id = ${id}`;
  const draft = rows[0];
  if (!draft) throw new HttpError(404, "Draft not found.");
  if (draft.status !== "local") throw new HttpError(400, "This draft is already in Gmail. Edit it there.");
  if (typeof subject !== "string" || typeof body !== "string" || !subject.trim() || !body.trim()) {
    throw new HttpError(400, "Subject and body cannot be empty.");
  }
  // a line break in the subject could smuggle extra headers into the email
  if (subject.length > 300 || body.length > 10000 || /[\r\n]/.test(subject.trim())) {
    throw new HttpError(400, "That subject or email is too long.");
  }
  const updated = await sql`update hub_drafts set subject = ${subject.trim()}, body = ${body.trim()} where id = ${id} returning *`;
  return updated[0];
}

// Puts a local draft into the Gmail drafts folder. Nothing is sent.
export async function pushDraft(id) {
  const rows = await sql`select * from hub_drafts where id = ${id}`;
  const draft = rows[0];
  if (!draft) throw new HttpError(404, "Draft not found.");
  if (draft.status !== "local") throw new HttpError(400, "This draft is already in Gmail.");
  const lead = await getLead(draft.lead_id);
  let created;
  try {
    created = await gmail.createDraft({ to: lead.email, subject: draft.subject, body: draft.body });
  } catch (e) {
    throw new HttpError(e.status === 400 ? 400 : 502, e.message);
  }
  const updated = await sql`
    update hub_drafts set status = 'in_gmail', gmail_draft_id = ${created.draftId}, gmail_thread_id = ${created.threadId}
    where id = ${id} returning *`;
  await sql`update hub_leads set status = 'drafted', updated_at = now() where id = ${lead.id} and status = 'new'`;
  return updated[0];
}

export async function updateLead(id, patch) {
  const lead = await getLead(id);
  const status = patch.status ?? lead.status;
  if (!STATUSES.includes(status)) throw new HttpError(400, "Unknown status.");
  const rows = await sql`
    update hub_leads set
      status = ${status},
      name = ${clip(patch.name, 200) || lead.name},
      hook = ${typeof patch.hook === "string" ? patch.hook.slice(0, 2000) : lead.hook},
      language = ${patch.language === "cs" || patch.language === "en" ? patch.language : lead.language},
      email_verified = ${typeof patch.email_verified === "boolean" ? patch.email_verified : lead.email_verified},
      replied_at = ${status === "replied" && !lead.replied_at ? new Date() : lead.replied_at},
      contacted_at = ${status === "contacted" && !lead.contacted_at ? new Date() : lead.contacted_at},
      updated_at = now()
    where id = ${id} returning *`;
  return rows[0];
}

export async function deleteLead(id) {
  await sql`delete from hub_leads where id = ${id}`;
}

/* ----------------------------------------------------------------- sync */

const KINDS = ["initial", "followup1", "followup2"];

async function followUp(lead, drafts, number, thread) {
  const sent = drafts.filter((d) => d.status === "sent");
  const draft = await writeFollowup(lead, sent, number);
  const last = [...thread].reverse().find((m) => m.sent);
  const subject = `Re: ${drafts[0].subject}`;
  const created = await gmail.createDraft({
    to: lead.email,
    subject,
    body: draft.body,
    threadId: drafts[0].gmail_thread_id,
    inReplyTo: last?.messageId,
  });
  await sql`
    insert into hub_drafts (lead_id, kind, subject, body, status, gmail_draft_id, gmail_thread_id, created_by)
    values (${lead.id}, ${KINDS[number]}, ${subject}, ${draft.body}, 'in_gmail', ${created.draftId}, ${created.threadId}, 'hub')
    on conflict (lead_id, kind) do nothing`;
}

// Reads Gmail to move the pipeline forward: notices drafts that were sent,
// replies and bounces, prepares follow-up drafts, and marks leads cold.
export async function sync() {
  const report = { sent: 0, replied: 0, bounced: 0, followups: 0, cold: 0, missing: 0, errors: [] };
  const leads = (await listLeads()).filter(
    (l) => ["drafted", "contacted"].includes(l.status) && l.drafts.some((d) => d.gmail_thread_id),
  );

  for (const lead of leads) {
    try {
      const drafts = KINDS.map((k) => lead.drafts.find((d) => d.kind === k)).filter(Boolean);
      const initial = drafts[0];
      if (!initial?.gmail_thread_id) continue;

      const thread = await gmail.thread(initial.gmail_thread_id);
      if (!thread) {
        // The draft was deleted in Gmail before it was sent.
        if (lead.status === "drafted") {
          await sql`delete from hub_drafts where lead_id = ${lead.id}`;
          await sql`update hub_leads set status = 'new', updated_at = now() where id = ${lead.id}`;
          report.missing++;
        }
        continue;
      }

      // The n-th message we sent in the thread is the n-th draft.
      const sentMessages = thread.filter((m) => m.sent);
      for (let i = 0; i < drafts.length; i++) {
        if (drafts[i].status === "in_gmail" && sentMessages[i]) {
          drafts[i].status = "sent";
          drafts[i].sent_at = sentMessages[i].date;
          await sql`update hub_drafts set status = 'sent', sent_at = ${sentMessages[i].date} where id = ${drafts[i].id}`;
          report.sent++;
        }
      }
      if (initial.status !== "sent") continue;

      const contactedAt = new Date(initial.sent_at);
      if (lead.status === "drafted") {
        await sql`update hub_leads set status = 'contacted', contacted_at = ${contactedAt}, updated_at = now() where id = ${lead.id}`;
      }

      const inbound = thread.filter((m) => !m.sent && !m.draft);
      if (inbound.some((m) => m.bounce)) {
        await sql`update hub_leads set status = 'bounced', updated_at = now() where id = ${lead.id}`;
        report.bounced++;
        continue;
      }
      if (inbound.length || (await gmail.receivedFrom(lead.email, contactedAt))) {
        await sql`update hub_leads set status = 'replied', replied_at = now(), updated_at = now() where id = ${lead.id}`;
        report.replied++;
        continue;
      }

      const age = Date.now() - contactedAt.getTime();
      const [, f1, f2] = KINDS.map((k) => drafts.find((d) => d.kind === k));
      if (!f1) {
        if (age >= FOLLOWUP_1_AFTER && report.followups < FOLLOWUPS_PER_RUN) {
          await followUp(lead, drafts, 1, thread);
          report.followups++;
        }
      } else if (f1.status === "sent" && !f2) {
        if (age >= FOLLOWUP_2_AFTER && report.followups < FOLLOWUPS_PER_RUN) {
          await followUp(lead, drafts, 2, thread);
          report.followups++;
        }
      } else if (
        (f2?.status === "sent" && Date.now() - new Date(f2.sent_at).getTime() >= COLD_AFTER) ||
        // follow-up drafts left unsent: give up on the lead eventually anyway
        age >= FOLLOWUP_2_AFTER + 2 * COLD_AFTER
      ) {
        await sql`update hub_leads set status = 'cold', updated_at = now() where id = ${lead.id}`;
        report.cold++;
      }
    } catch (e) {
      report.errors.push(`${lead.name}: ${e.message}`);
    }
  }
  return report;
}

/* ---------------------------------------------------------------- audit */

const SITE = (process.env.SITE_URL || "https://www.dupscaled.com").replace(/\/+$/, "");

export function auditUrl(slug) {
  return `${SITE}/a/${slug}`;
}

// Readable, but with a random tail so audits cannot be found by guessing.
function newSlug(name) {
  const base = name
    .normalize("NFKD")
    .replace(/\p{M}/gu, "") // strip the accents split off by NFKD
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "audit"}-${randomBytes(8).toString("base64url").replace(/[-_]/g, "x").toLowerCase()}`;
}

// Researches the lead and stores the audit. Running it again replaces the
// content but keeps the link, so a link already sent in an email stays valid.
export async function createAudit(leadId, user, { emit, deadline }) {
  const lead = await getLead(leadId);
  const data = await researchAudit(lead, { emit, deadline });
  if (!data) throw new HttpError(504, "The research ran out of time. Try again.");
  const rows = await sql`
    insert into hub_audits (lead_id, slug, data, created_by)
    values (${leadId}, ${newSlug(lead.name)}, ${JSON.stringify(data)}::jsonb, ${user.email})
    on conflict (lead_id) do update set data = excluded.data, created_at = now(), created_by = excluded.created_by
    returning lead_id, slug, views, created_at, first_viewed_at, last_viewed_at`;
  return rows[0];
}

export async function getAudit(slug) {
  if (typeof slug !== "string" || !/^[a-z0-9-]{10,80}$/.test(slug)) return null;
  const rows = await sql`
    select a.slug, a.data, a.created_at, l.name, l.language, l.website
    from hub_audits a join hub_leads l on l.id = a.lead_id
    where a.slug = ${slug}`;
  return rows[0] || null;
}

export async function recordAuditView(slug) {
  await sql`
    update hub_audits
    set views = views + 1, first_viewed_at = coalesce(first_viewed_at, now()), last_viewed_at = now()
    where slug = ${slug}`;
}
