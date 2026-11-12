import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Quotes from "@/components/AdminHub/Quotes";

// Prices are for admins only; team members are sent back to the pipeline.
export default async function Page() {
  if ((await auth())?.user?.role !== "admin") redirect("/adminhub");
  return <Quotes />;
}
