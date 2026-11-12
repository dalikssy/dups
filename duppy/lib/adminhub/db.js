import { neon } from "@neondatabase/serverless";

let client;
let ready;

function raw() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  if (!client) client = neon(process.env.DATABASE_URL);
  return client;
}

// Tables are created on the first query of each cold start, so there is no
// separate migration step to run after connecting the database.
const SCHEMA = [
  `create table if not exists hub_users (
    email text primary key,
    name text,
    role text not null default 'team',
    created_at timestamptz not null default now()
  )`,
  `create table if not exists hub_settings (
    key text primary key,
    value jsonb not null
  )`,
  `create table if not exists hub_leads (
    id serial primary key,
    name text not null,
    category text,
    segment text,
    market text,
    language text not null default 'en',
    email text not null,
    email_source_url text,
    email_verified boolean not null default false,
    website text,
    hook text,
    status text not null default 'new',
    created_by text,
    created_at timestamptz not null default now(),
    contacted_at timestamptz,
    replied_at timestamptz,
    updated_at timestamptz not null default now()
  )`,
  `create unique index if not exists hub_leads_email_idx on hub_leads (lower(email))`,
  `create table if not exists hub_drafts (
    id serial primary key,
    lead_id integer not null references hub_leads(id) on delete cascade,
    kind text not null default 'initial',
    subject text not null,
    body text not null,
    status text not null default 'local',
    gmail_draft_id text,
    gmail_thread_id text,
    created_by text,
    created_at timestamptz not null default now(),
    sent_at timestamptz
  )`,
  `create unique index if not exists hub_drafts_lead_kind_idx on hub_drafts (lead_id, kind)`,
  `create table if not exists hub_audits (
    id serial primary key,
    lead_id integer not null unique references hub_leads(id) on delete cascade,
    slug text not null unique,
    data jsonb not null,
    created_by text,
    created_at timestamptz not null default now(),
    views integer not null default 0,
    first_viewed_at timestamptz,
    last_viewed_at timestamptz
  )`,
  `create table if not exists hub_clients (
    id serial primary key,
    name text not null,
    email text not null,
    password_hash text,
    session_version integer not null default 1,
    status text not null default 'active',
    notes text,
    failed_logins integer not null default 0,
    locked_until timestamptz,
    last_login_at timestamptz,
    created_by text,
    created_at timestamptz not null default now()
  )`,
  `create unique index if not exists hub_clients_email_idx on hub_clients (lower(email))`,
  `create table if not exists hub_deliverables (
    id serial primary key,
    client_id integer not null references hub_clients(id) on delete cascade,
    title text not null,
    due_date date,
    status text not null default 'in_progress',
    assignee text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`,
  `create table if not exists hub_stats (
    id serial primary key,
    client_id integer not null references hub_clients(id) on delete cascade,
    week date not null,
    platform text not null,
    followers bigint,
    views bigint
  )`,
  `create unique index if not exists hub_stats_week_idx on hub_stats (client_id, week, platform)`,
  `create table if not exists hub_reports (
    id serial primary key,
    client_id integer not null references hub_clients(id) on delete cascade,
    week date not null,
    body text not null,
    created_by text,
    created_at timestamptz not null default now()
  )`,
  `create unique index if not exists hub_reports_week_idx on hub_reports (client_id, week)`,
  `create table if not exists hub_quotes (
    id serial primary key,
    client text not null,
    url text,
    data jsonb not null,
    created_by text,
    created_at timestamptz not null default now()
  )`,
  `alter table hub_clients add column if not exists retainer numeric`,
  `alter table hub_clients add column if not exists retainer_currency text not null default 'EUR'`,
  `create table if not exists hub_payments (
    id serial primary key,
    client_id integer not null references hub_clients(id) on delete cascade,
    month date not null,
    amount numeric not null,
    currency text not null,
    paid boolean not null default false,
    paid_at timestamptz
  )`,
  `create unique index if not exists hub_payments_month_idx on hub_payments (client_id, month)`,
];

function ensureSchema() {
  if (!ready) {
    ready = (async () => {
      for (const statement of SCHEMA) await raw().query(statement);
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

export async function sql(strings, ...values) {
  await ensureSchema();
  return raw()(strings, ...values);
}

export async function getSetting(key) {
  const rows = await sql`select value from hub_settings where key = ${key}`;
  return rows[0]?.value ?? null;
}

export async function setSetting(key, value) {
  await sql`insert into hub_settings (key, value) values (${key}, ${JSON.stringify(value)}::jsonb)
    on conflict (key) do update set value = excluded.value`;
}

export async function deleteSetting(key) {
  await sql`delete from hub_settings where key = ${key}`;
}
