import { route, requireUser, requireAdmin } from "@/lib/adminhub/session";
import { clientDetail, updateClient, deleteClient, teamEmails } from "@/lib/adminhub/clients";

export const dynamic = "force-dynamic";

export const GET = route(async (request, { params }) => {
  await requireUser();
  return Response.json({ ...(await clientDetail(Number(params.id))), team: await teamEmails() });
});

export const PATCH = route(async (request, { params }) => {
  await requireUser();
  await updateClient(Number(params.id), await request.json());
  return Response.json({ ok: true });
});

export const DELETE = route(async (request, { params }) => {
  await requireAdmin();
  await deleteClient(Number(params.id));
  return Response.json({ ok: true });
});
