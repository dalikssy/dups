import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Settings from "@/components/AdminHub/Settings";

export default async function Page({ searchParams }) {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/adminhub");
  return <Settings me={session.user.email} gmailResult={searchParams?.gmail || ""} />;
}
