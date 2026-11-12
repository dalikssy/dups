import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Clients from "@/components/AdminHub/Clients";

export default async function Page() {
  if (!(await auth())?.user?.role) redirect("/adminhub/login");
  return <Clients />;
}
