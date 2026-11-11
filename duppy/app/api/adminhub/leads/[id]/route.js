import { route, requireUser } from "@/lib/adminhub/session";
import { updateLead, deleteLead } from "@/lib/adminhub/outreach";

export const PATCH = route(async (request, { params }) => {
  await requireUser();
  return Response.json({ lead: await updateLead(Number(params.id), await request.json()) });
});

export const DELETE = route(async (request, { params }) => {
  await requireUser();
  await deleteLead(Number(params.id));
  return Response.json({ ok: true });
});
