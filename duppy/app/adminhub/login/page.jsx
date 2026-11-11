import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

export default async function Login({ searchParams }) {
  const session = await auth();
  if (session?.user?.role) redirect("/adminhub");

  async function login() {
    "use server";
    await signIn("google", { redirectTo: "/adminhub" });
  }

  return (
    <div className="hub-login">
      <div className="panel">
        <div className="stack">
          <span className="tag">Admin_hub</span>
          <strong>DUPSCALED</strong>
        </div>
        {searchParams?.error && (
          <p className="note bad" role="alert">
            {searchParams.error === "AccessDenied"
              ? "This Google account is not on the team list. Ask an admin to add it."
              : "Sign-in did not complete. Try again."}
          </p>
        )}
        <form action={login}>
          <button className="btn primary" type="submit" style={{ width: "100%" }}>
            Sign in with Google
          </button>
        </form>
        <p className="small muted">Team members only.</p>
      </div>
    </div>
  );
}
