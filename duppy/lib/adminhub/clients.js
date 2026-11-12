import { sql } from "./db";
import { HttpError } from "./errors";
import { hashPassword, newPassword } from "@/lib/portal/auth";

export const CLIENT_STATUSES = ["active", "paused", "ended"];
export const DELIVERABLE_STATUSES = ["in_progress", "review", "done"];
export const PLATFORMS = ["tiktok", "instagram", "youtube"];

const clip = (value, max) => (typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null);
const isDate = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
const count = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n < 1e13 ? Math.round(n) : null;
};

// Stats and reports are filed under the Monday of their week.
export function monday(date) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

export async function listClients() {
  const clients = await sql`
    select id, name, email, status, last_login_at, created_at, (password_hash is not null) as has_password
    from hub_clients order by status, name`;
  const open = await sql`
    select client_id, count(*)::int as open from hub_deliverables where status <> 'done' group by client_id`;
  const openOf = new Map(open.map((r) => [r.client_id, r.open]));
  return clients.map((c) => ({ ...c, open: openOf.get(c.id) || 0 }));
}

async function exists(id) {
  const rows = await sql`select id from hub_clients where id = ${id}`;
  if (!rows[0]) throw new HttpError(404, "Client not found.");
}

// Everything about one client. forClient leaves out what only the team sees.
export async function clientDetail(id, { forClient = false } = {}) {
  const rows = await sql`
    select id, name, email, status, notes, last_login_at, created_at, (password_hash is not null) as has_password
    from hub_clients where id = ${id}`;
  const client = rows[0];
  if (!client) throw new HttpError(404, "Client not found.");
  const [deliverables, stats, reports] = await Promise.all([
    sql`select id, title, to_char(due_date, 'YYYY-MM-DD') as due_date, status, assignee, updated_at
        from hub_deliverables where client_id = ${id} order by (status = 'done'), due_date nulls last, id`,
    sql`select to_char(week, 'YYYY-MM-DD') as week, platform, followers::float8 as followers, views::float8 as views
        from hub_stats where client_id = ${id} order by week, platform`,
    sql`select id, to_char(week, 'YYYY-MM-DD') as week, body, created_at
        from hub_reports where client_id = ${id} order by week desc`,
  ]);
  if (forClient) {
    return {
      client: { name: client.name },
      deliverables: deliverables.map(({ assignee, ...d }) => d),
      stats,
      reports,
    };
  }
  return { client, deliverables, stats, reports };
}

export async function createClient(input, user) {
  const name = clip(input?.name, 200);
  const email = clip(input?.email, 254)?.toLowerCase();
  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, "Name and a valid email are required.");
  }
  const password = newPassword();
  const rows = await sql`
    insert into hub_clients (name, email, password_hash, created_by)
    values (${name}, ${email}, ${await hashPassword(password)}, ${user.email})
    on conflict (lower(email)) do nothing
    returning id`;
  if (!rows[0]) throw new HttpError(409, "A client with this email already exists.");
  // The password is shown to the team once, here, and never stored in the clear.
  return { id: rows[0].id, password };
}

export async function resetPassword(id) {
  await exists(id);
  const password = newPassword();
  await sql`
    update hub_clients
    set password_hash = ${await hashPassword(password)}, session_version = session_version + 1,
        failed_logins = 0, locked_until = null
    where id = ${id}`;
  return { password };
}

export async function updateClient(id, patch) {
  await exists(id);
  const status = CLIENT_STATUSES.includes(patch?.status) ? patch.status : null;
  // null leaves a field as it is; notes may be cleared with an empty string
  const notes = typeof patch?.notes === "string" ? patch.notes.slice(0, 5000) : null;
  await sql`
    update hub_clients set
      name = coalesce(${clip(patch?.name, 200)}, name),
      status = coalesce(${status}, status),
      notes = coalesce(${notes}, notes)
    where id = ${id}`;
}

export async function deleteClient(id) {
  await sql`delete from hub_clients where id = ${id}`;
}

export async function saveDeliverable(clientId, input) {
  await exists(clientId);
  const title = clip(input?.title, 300);
  const status = DELIVERABLE_STATUSES.includes(input?.status) ? input.status : "in_progress";
  const due = isDate(input?.due_date) ? input.due_date : null;
  const assignee = clip(input?.assignee, 254)?.toLowerCase() || null;
  if (input?.id) {
    const rows = await sql`
      update hub_deliverables set
        title = coalesce(${title}, title), status = ${status}, due_date = ${due}, assignee = ${assignee}, updated_at = now()
      where id = ${Number(input.id)} and client_id = ${clientId} returning id`;
    if (!rows[0]) throw new HttpError(404, "Deliverable not found.");
    return;
  }
  if (!title) throw new HttpError(400, "Give the deliverable a title.");
  await sql`
    insert into hub_deliverables (client_id, title, status, due_date, assignee)
    values (${clientId}, ${title}, ${status}, ${due}, ${assignee})`;
}

export async function deleteDeliverable(clientId, id) {
  await sql`delete from hub_deliverables where id = ${id} and client_id = ${clientId}`;
}

// One week's numbers: {week, tiktok: {followers, views}, instagram: ..., youtube: ...}
export async function saveWeek(clientId, input) {
  await exists(clientId);
  if (!isDate(input?.week)) throw new HttpError(400, "Pick the week.");
  const week = monday(input.week);
  for (const platform of PLATFORMS) {
    const followers = count(input[platform]?.followers);
    const views = count(input[platform]?.views);
    if (followers === null && views === null) {
      await sql`delete from hub_stats where client_id = ${clientId} and week = ${week} and platform = ${platform}`;
      continue;
    }
    await sql`
      insert into hub_stats (client_id, week, platform, followers, views)
      values (${clientId}, ${week}, ${platform}, ${followers}, ${views})
      on conflict (client_id, week, platform) do update set followers = excluded.followers, views = excluded.views`;
  }
  if (typeof input.report === "string") {
    const body = input.report.trim().slice(0, 8000);
    if (!body) await sql`delete from hub_reports where client_id = ${clientId} and week = ${week}`;
    else {
      await sql`
        insert into hub_reports (client_id, week, body, created_by) values (${clientId}, ${week}, ${body}, ${input.by || null})
        on conflict (client_id, week) do update set body = excluded.body`;
    }
  }
  return week;
}

export async function teamEmails() {
  const env = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  const rows = await sql`select email, name from hub_users order by created_at`;
  const all = new Map(env.map((e) => [e, e]));
  for (const r of rows) all.set(r.email, r.name || r.email);
  return [...all].map(([email, name]) => ({ email, name }));
}
