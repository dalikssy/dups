import { route, requireUser } from "@/lib/adminhub/session";
import { listLeads, addLead } from "@/lib/adminhub/outreach";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireUser();
  return Response.json({ leads: await listLeads() });
});

export const POST = route(async (request) => {
  const user = await requireUser();
  return Response.json({ lead: await addLead(await request.json(), user) });
});
