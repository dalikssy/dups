import { redirect } from "next/navigation";
import { auth } from "@/auth";
import CampaignEditor from "@/components/AdminHub/CampaignEditor";

export default async function Page({ params }) {
  if (!(await auth())?.user?.role) redirect("/adminhub/login");
  return <CampaignEditor clientId={Number(params.id)} campaignId={Number(params.cid)} />;
}
