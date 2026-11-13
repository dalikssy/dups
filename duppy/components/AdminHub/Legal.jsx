import Link from "next/link";
import Logo from "@/components/Brand/Logo";

// Shared frame for the public legal pages of the hub.
export default function Legal({ tag, title, updated, children }) {
  return (
    <main className="hub-legal">
      <header className="audit-top">
        <Logo variant="full" height={24} />
        <Link className="btn sm quiet" href="/adminhub/login">Sign in</Link>
      </header>
      <div className="stack" style={{ gap: 10, margin: "56px 0 28px" }}>
        <span className="tag">{tag}</span>
        <h1>{title}</h1>
        <span className="tag dim">Last updated {updated}</span>
      </div>
      <div className="hub-legal-body">{children}</div>
      <footer className="audit-foot">
        <span>
          <Link href="/adminhub/terms">Terms</Link> · <Link href="/adminhub/privacy">Privacy</Link>
        </span>
        <a href="https://www.dupscaled.com">www.dupscaled.com</a>
      </footer>
    </main>
  );
}
