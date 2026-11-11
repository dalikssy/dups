import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Leads from "@/components/AdminHub/Leads";

export default async function Page() {
  if (!(await auth())?.user?.role) redirect("/adminhub/login");
  return <Leads />;
}
