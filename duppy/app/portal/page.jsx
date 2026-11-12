import { redirect } from "next/navigation";
import { currentClient, signOut } from "@/lib/portal/auth";
import { clientDetail } from "@/lib/adminhub/clients";
import Logo from "@/components/Brand/Logo";
import Backdrop from "@/components/Brand/Backdrop";
import Charts from "@/components/Portal/Charts";

export const dynamic = "force-dynamic";

const STATUS = {
  in_progress: ["In progress", "warn"],
  review: ["In review", "info"],
  done: ["Done", "ok"],
};

const day = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export default async function Portal() {
  const me = await currentClient();
  if (!me) redirect("/portal/login");
  // Everything shown here is loaded for the signed-in client's own id only.
  const { client, deliverables, stats, reports } = await clientDetail(me.id, { forClient: true });

  async function logout() {
    "use server";
    signOut();
    redirect("/portal/login");
  }

  const open = deliverables.filter((d) => d.status !== "done");
  const done = deliverables.filter((d) => d.status === "done");

  return (
    <>
      <Backdrop lines={false} quiet />
      <main className="portal">
        <div className="portal-top">
          <Logo variant="full" height={24} />
          <form action={logout}>
            <button className="btn sm quiet" type="submit">Sign out</button>
          </form>
        </div>

        <header className="hub-head hero" style={{ "--art": "url(/brand/bg-hero-portal.jpg)" }}>
          <div>
            <span className="tag">Client_portal</span>
            <h1>{client.name}</h1>
            <p className="lede">Your deliverables, numbers and weekly updates in one place.</p>
          </div>
        </header>

        <section>
          <span className="tag">Numbers_</span>
          <h2>How your channels are growing</h2>
          <Charts stats={stats} />
        </section>

        <section>
          <span className="tag">Deliverables_</span>
          <h2>What we are working on</h2>
          {deliverables.length === 0 && <p className="muted">Nothing scheduled yet.</p>}
          {[...open, ...done].map((d) => (
            <article className="glass portal-dlv" key={d.id}>
              <b>{d.title}</b>
              <span className="small muted">{d.due_date ? `Due ${day(d.due_date)}` : ""}</span>
              <span className={`pill ${STATUS[d.status]?.[1] || ""}`}>{STATUS[d.status]?.[0] || d.status}</span>
            </article>
          ))}
        </section>

        <section>
          <span className="tag">Weekly_report</span>
          <h2>Updates from the team</h2>
          {reports.length === 0 && <p className="muted">The first weekly update will appear here.</p>}
          {reports.map((r) => (
            <article className="glass portal-report" key={r.id}>
              <span className="tag blue">Week of {day(r.week)}</span>
              <p>{r.body}</p>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}
