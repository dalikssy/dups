import { redirect } from "next/navigation";
import { auth } from "@/auth";
import ClientDetail from "@/components/AdminHub/ClientDetail";

export default async function Page({ params }) {
  const role = (await auth())?.user?.role;
  if (!role) redirect("/adminhub/login");
  return <ClientDetail id={Number(params.id)} admin={role === "admin"} />;
}
