import { route, requireUser, requireAdmin } from "@/lib/adminhub/session";
import { connection, SENDER } from "@/lib/adminhub/gmail";
import { deleteSetting } from "@/lib/adminhub/db";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireUser();
  return Response.json({ sender: SENDER, connection: await connection() });
});

export const DELETE = route(async () => {
  await requireAdmin();
  await deleteSetting("gmail");
  return Response.json({ ok: true });
});
