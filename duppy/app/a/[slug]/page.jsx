import "../../adminhub/hub.css";
import "../../adminhub/hub-v2.css";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getAudit, recordAuditView } from "@/lib/adminhub/outreach";
import { httpUrl } from "@/lib/adminhub/verify";
import Logo from "@/components/Brand/Logo";
import Backdrop from "@/components/Brand/Backdrop";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Short-form audit · DUPSCALED",
  robots: { index: false, follow: false },
};

const BOTS = /bot|crawl|spider|preview|slack|facebookexternalhit|whatsapp|telegram|discord|headless|lighthouse|monitor|scan/i;

const TEXT = {
  en: {
    tag: "Short-form audit_",
    download: "Download PDF",
    channels: ["Channels_", "Where you publish today"],
    working: ["Strengths_", "What is already working"],
    gaps: ["Reach_", "Where views are being left on the table"],
    clips: ["First cuts_", "Clips we would cut first"],
    next: ["Next_", "How we would start"],
    source: "Source",
    cta: "Two free sample clips, cut from your own content.",
    ctaSub: "No commitment. Reply to the email and we will send them over.",
    prepared: "Prepared",
  },
  cs: {
    tag: "Short-form audit_",
    download: "Stáhnout PDF",
    channels: ["Kanály_", "Kde dnes publikujete"],
    working: ["Silné stránky_", "Co už funguje"],
    gaps: ["Dosah_", "Kde zůstávají views nevyužité"],
    clips: ["První střihy_", "Klipy, které bychom udělali jako první"],
    next: ["Další kroky_", "Jak bychom začali"],
    source: "Zdroj",
    cta: "Dva ukázkové klipy zdarma, z vašeho vlastního obsahu.",
    ctaSub: "Bez závazku. Stačí odpovědět na e-mail a pošleme je.",
    prepared: "Připraveno",
  },
};

function Section({ head, children }) {
  return (
    <section className="audit-section">
      <span className="tag">{head[0]}</span>
      <h2>{head[1]}</h2>
      {children}
    </section>
  );
}

export default async function AuditPage({ params }) {
  const audit = await getAudit(params.slug);
  if (!audit) notFound();

  // Count real opens only: not the team previewing it, not link scanners.
  const agent = headers().get("user-agent") || "";
  const team = Boolean((await auth())?.user?.role);
  if (!team && agent && !BOTS.test(agent)) await recordAuditView(audit.slug);

  const cs = audit.language === "cs";
  const t = TEXT[cs ? "cs" : "en"];
  const a = audit.data;
  const date = new Date(audit.created_at).toLocaleDateString(cs ? "cs-CZ" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="hub" lang={cs ? "cs" : "en"}>
      <Backdrop lines={false} quiet />
      <div className="audit-art" aria-hidden="true" />
      <main className="audit">
        <header className="audit-top">
          <Logo variant="full" height={26} />
          <a className="btn primary" href={`/a/${audit.slug}/pdf`}>{t.download}</a>
        </header>

        <div className="audit-hero">
          <span className="tag">{t.tag}</span>
          <h1>{audit.name}</h1>
          <p className="audit-headline">{a.headline}</p>
          <p className="audit-summary">{a.summary}</p>
          <span className="tag dim">{t.prepared} {date}</span>
        </div>

        {a.channels?.length > 0 && (
          <Section head={t.channels}>
            <div className="audit-grid">
              {a.channels.map((c, i) => {
                const url = httpUrl(c.url);
                return (
                  <article className="glass audit-card" key={i}>
                    <div className="row" style={{ justifyContent: "space-between" }}>
                      <span className="tag blue">{c.platform}</span>
                      {c.audience && <span className="tag dim">{c.audience}</span>}
                    </div>
                    <b>{url ? <a href={url} target="_blank" rel="noreferrer nofollow">{c.handle}</a> : c.handle}</b>
                    <p className="muted">{c.note}</p>
                  </article>
                );
              })}
            </div>
          </Section>
        )}

        {a.working?.length > 0 && (
          <Section head={t.working}>
            <ul className="audit-points">
              {a.working.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </Section>
        )}

        {a.gaps?.length > 0 && (
          <Section head={t.gaps}>
            <div className="stack">
              {a.gaps.map((g, i) => (
                <article className="glass audit-card numbered" key={i}>
                  <span className="num">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <b>{g.title}</b>
                    <p className="muted">{g.detail}</p>
                  </div>
                </article>
              ))}
            </div>
          </Section>
        )}

        {a.clip_ideas?.length > 0 && (
          <Section head={t.clips}>
            <div className="audit-grid">
              {a.clip_ideas.map((c, i) => (
                <article className="glass audit-card" key={i}>
                  <b>{c.title}</b>
                  <p className="audit-hook">“{c.hook}”</p>
                  <p>{c.why}</p>
                  <p className="small muted">{t.source}: {c.source}</p>
                </article>
              ))}
            </div>
          </Section>
        )}

        {a.next_steps?.length > 0 && (
          <Section head={t.next}>
            <ol className="audit-steps">
              {a.next_steps.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          </Section>
        )}

        <div className="audit-cta">
          <h2>{t.cta}</h2>
          <p>{t.ctaSub}</p>
        </div>

        <footer className="audit-foot">
          <Logo variant="mark" height={18} title="" />
          <a href="https://www.dupscaled.com">www.dupscaled.com</a>
        </footer>
      </main>
    </div>
  );
}
