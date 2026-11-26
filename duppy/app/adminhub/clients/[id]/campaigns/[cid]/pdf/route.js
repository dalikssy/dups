import { route, requireUser } from "@/lib/adminhub/session";
import { getCampaign } from "@/lib/adminhub/campaigns";
import { campaignPdf, pdfResponse } from "@/lib/adminhub/campaignPdf";

export const dynamic = "force-dynamic";

export const GET = route(async (request, { params }) => {
  await requireUser();
  const campaign = await getCampaign(Number(params.id), Number(params.cid));
  return pdfResponse(campaign, await campaignPdf(campaign));
});
