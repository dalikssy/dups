import { route, requireUser } from "@/lib/adminhub/session";
import { generateDraft } from "@/lib/adminhub/outreach";

export const maxDuration = 120;

// Writes (or rewrites) the first email for one lead.
export const POST = route(async (request) => {
  const user = await requireUser();
  const { leadId } = await request.json();
  return Response.json({ draft: await generateDraft(Number(leadId), user) });
});
