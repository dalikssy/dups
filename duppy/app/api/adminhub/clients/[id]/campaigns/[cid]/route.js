import { route, requireUser } from "@/lib/adminhub/session";
import { getCampaign, deleteCampaign } from "@/lib/adminhub/campaigns";

export const dynamic = "force-dynamic";

export const GET = route(async (request, { params }) => {
  await requireUser();
  return Response.json({ campaign: await getCampaign(Number(params.id), Number(params.cid)) });
});

export const DELETE = route(async (request, { params }) => {
  await requireUser();
  await deleteCampaign(Number(params.id), Number(params.cid));
  return Response.json({ ok: true });
});
