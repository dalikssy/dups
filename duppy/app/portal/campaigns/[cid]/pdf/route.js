import { currentClient } from "@/lib/portal/auth";
import { getCampaign } from "@/lib/adminhub/campaigns";
import { campaignPdf, pdfResponse } from "@/lib/adminhub/campaignPdf";
import { HttpError } from "@/lib/adminhub/errors";

export const dynamic = "force-dynamic";

// The signed-in client's own campaign as a PDF; any other id is "not found".
export async function GET(request, { params }) {
  const me = await currentClient();
  if (!me) return new Response("Sign in first", { status: 401 });
  try {
    const campaign = await getCampaign(me.id, Number(params.cid));
    return pdfResponse(campaign, await campaignPdf(campaign));
  } catch (e) {
    if (e instanceof HttpError) return new Response(e.message, { status: e.status });
    console.error(e);
    return new Response("Something went wrong.", { status: 500 });
  }
}
