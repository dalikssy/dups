import { route, requireAdmin, HttpError } from "@/lib/adminhub/session";
import { sql } from "@/lib/adminhub/db";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireAdmin();
  const envAdmins = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return Response.json({ users: await sql`select * from hub_users order by created_at`, envAdmins });
});

export const POST = route(async (request) => {
  await requireAdmin();
  const { email, name, role } = await request.json();
  const address = (email || "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(address)) throw new HttpError(400, "Enter a valid email.");
  const rows = await sql`
    insert into hub_users (email, name, role)
    values (${address}, ${name?.trim() || null}, ${role === "admin" ? "admin" : "team"})
    on conflict (email) do update set name = excluded.name, role = excluded.role
    returning *`;
  return Response.json({ user: rows[0] });
});

export const DELETE = route(async (request) => {
  const admin = await requireAdmin();
  const email = new URL(request.url).searchParams.get("email")?.toLowerCase();
  if (email === admin.email.toLowerCase()) throw new HttpError(400, "You cannot remove yourself.");
  await sql`delete from hub_users where email = ${email}`;
  return Response.json({ ok: true });
});
