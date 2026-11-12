import { redirect } from "next/navigation";
import { currentClient, signIn } from "@/lib/portal/auth";
import Logo from "@/components/Brand/Logo";

export const dynamic = "force-dynamic";

export default async function PortalLogin({ searchParams }) {
  if (await currentClient()) redirect("/portal");

  async function login(formData) {
    "use server";
    const result = await signIn(formData.get("email"), formData.get("password"));
    redirect(result.ok ? "/portal" : `/portal/login?error=${encodeURIComponent(result.error)}`);
  }

  return (
    <div className="hub-login split">
      <div className="login-art">
        <div className="claim">
          <span className="tag">Client_portal</span>
          <p>Ready to <em>upscale</em> your numbers?</p>
        </div>
      </div>
      <div className="login-side">
      <form className="panel" action={login}>
        <div className="lockup">
          <Logo variant="full" height={34} />
          <span className="tag">Client_portal</span>
        </div>
        {searchParams?.error && <p className="note bad" role="alert">{String(searchParams.error).slice(0, 200)}</p>}
        <label className="lbl">
          Email
          <input className="field" type="email" name="email" autoComplete="username" required />
        </label>
        <label className="lbl">
          Password
          <input className="field" type="password" name="password" autoComplete="current-password" required />
        </label>
        <button className="btn primary" type="submit" style={{ width: "100%" }}>Sign in</button>
        <p className="small muted">Your login comes from the DUPSCALED team. Lost it? Reply to any of our emails.</p>
      </form>
      </div>
    </div>
  );
}
