import { route, requireUser } from "@/lib/adminhub/session";
import { listClients, createClient, teamEmails } from "@/lib/adminhub/clients";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireUser();
  return Response.json({ clients: await listClients(), team: await teamEmails() });
});

export const POST = route(async (request) => {
  const user = await requireUser();
  return Response.json(await createClient(await request.json(), user));
});
