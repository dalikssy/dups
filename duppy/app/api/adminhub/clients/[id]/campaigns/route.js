import { route, requireUser } from "@/lib/adminhub/session";
import { listCampaigns, saveCampaign } from "@/lib/adminhub/campaigns";

export const dynamic = "force-dynamic";

export const GET = route(async (request, { params }) => {
  await requireUser();
  return Response.json({ campaigns: await listCampaigns(Number(params.id)) });
});

// {name, brand, summary, starts, ends, highlights} creates a campaign; with id it updates one.
export const POST = route(async (request, { params }) => {
  await requireUser();
  return Response.json(await saveCampaign(Number(params.id), await request.json()));
});
