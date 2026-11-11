import { route, requireUser } from "@/lib/adminhub/session";
import { editDraft } from "@/lib/adminhub/outreach";

export const PATCH = route(async (request, { params }) => {
  await requireUser();
  return Response.json({ draft: await editDraft(Number(params.id), await request.json()) });
});
