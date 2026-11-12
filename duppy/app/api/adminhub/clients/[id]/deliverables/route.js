import { route, requireUser } from "@/lib/adminhub/session";
import { saveDeliverable, deleteDeliverable } from "@/lib/adminhub/clients";

export const POST = route(async (request, { params }) => {
  await requireUser();
  await saveDeliverable(Number(params.id), await request.json());
  return Response.json({ ok: true });
});

export const DELETE = route(async (request, { params }) => {
  await requireUser();
  await deleteDeliverable(Number(params.id), Number(new URL(request.url).searchParams.get("id")));
  return Response.json({ ok: true });
});
