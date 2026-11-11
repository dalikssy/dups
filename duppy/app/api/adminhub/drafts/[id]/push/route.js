import { route, requireUser } from "@/lib/adminhub/session";
import { pushDraft } from "@/lib/adminhub/outreach";

export const POST = route(async (request, { params }) => {
  await requireUser();
  return Response.json({ draft: await pushDraft(Number(params.id)) });
});
