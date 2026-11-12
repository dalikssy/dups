import "./hub.css";
import "./hub-v2.css";
import { auth, signOut } from "@/auth";
import Nav from "@/components/AdminHub/Nav";
import Logo from "@/components/Brand/Logo";
import Backdrop from "@/components/Brand/Backdrop";

export const metadata = {
  title: "DUPSCALED Admin Hub",
  robots: { index: false, follow: false },
};

export const viewport = { themeColor: "#000000" };

export default async function HubLayout({ children }) {
  const session = await auth();
  const user = session?.user?.role ? session.user : null;

  // Signed out there is only the login page (middleware redirects the rest).
  if (!user) return <div className="hub">{children}</div>;

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/adminhub/login" });
  }

  return (
    <div className="hub">
      <Backdrop lines={false} quiet />
      <div className="hub-shell">
        <aside className="hub-side">
          <div className="hub-brand">
            <Logo variant="full" height={22} />
            <span className="tag">Admin_hub</span>
          </div>
          <Nav admin={user.role === "admin"} />
          <div className="hub-me">
            <span className="small muted">{user.email}</span>
            <form action={logout}>
              <button className="btn sm quiet" type="submit">Sign out</button>
            </form>
          </div>
        </aside>
        <main className="hub-main">{children}</main>
      </div>
    </div>
  );
}
