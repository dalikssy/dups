import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import Logo from "@/components/Brand/Logo";

export default async function Login({ searchParams }) {
  const session = await auth();
  if (session?.user?.role) redirect("/adminhub");

  async function login() {
    "use server";
    await signIn("google", { redirectTo: "/adminhub" });
  }

  return (
    <div className="hub-login split">
      <div className="login-art">
        <div className="claim">
          <span className="tag">Admin_hub</span>
          <p>Outreach, clients and numbers in <em>one place.</em></p>
        </div>
      </div>
      <div className="login-side">
      <div className="panel">
        <div className="lockup">
          <Logo variant="full" height={34} />
          <span className="tag">Admin_hub</span>
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
    </div>
  );
}
