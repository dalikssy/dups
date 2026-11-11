import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Pipeline from "@/components/AdminHub/Pipeline";

export default async function Page() {
  // checked here as well as in middleware, so the page never relies on one gate
  if (!(await auth())?.user?.role) redirect("/adminhub/login");
  return <Pipeline />;
}
