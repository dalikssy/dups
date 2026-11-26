import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentClient } from "@/lib/portal/auth";
import { getCampaign } from "@/lib/adminhub/campaigns";
import { HttpError } from "@/lib/adminhub/errors";
import Logo from "@/components/Brand/Logo";
import Backdrop from "@/components/Brand/Backdrop";
import CampaignReport from "@/components/Portal/CampaignReport";

export const dynamic = "force-dynamic";

const day = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export default async function Page({ params }) {
  const me = await currentClient();
  if (!me) redirect("/portal/login");
  let campaign;
  try {
    campaign = await getCampaign(me.id, Number(params.cid));
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) notFound();
    throw e;
  }
  const dates = [campaign.starts, campaign.ends].filter(Boolean).map(day).join(" – ");

  return (
    <>
      <Backdrop lines={false} quiet />
      <main className="portal">
        <div className="portal-top">
          <Logo variant="full" height={24} />
          <Link className="btn sm quiet" href="/portal">← Back</Link>
        </div>
        <header className="hub-head hero" style={{ "--art": "url(/brand/bg-hero-portal.jpg)" }}>
          <div>
            <span className="tag">Campaign_report</span>
            <h1>{campaign.name}</h1>
            <p className="lede">{[campaign.brand, dates].filter(Boolean).join(" · ")}</p>
            {campaign.summary && <p style={{ maxWidth: "62ch", whiteSpace: "pre-wrap" }}>{campaign.summary}</p>}
          </div>
        </header>
        <CampaignReport campaign={campaign} pdfHref={`/portal/campaigns/${campaign.id}/pdf`} />
      </main>
    </>
  );
}
