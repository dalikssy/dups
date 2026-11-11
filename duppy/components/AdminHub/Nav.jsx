"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/adminhub", label: "Pipeline" },
  { href: "/adminhub/leads", label: "Lead finder" },
  { href: "/adminhub/settings", label: "Settings", admin: true },
];

export default function Nav({ admin }) {
  const path = usePathname();
  return (
    <nav className="hub-nav" aria-label="Admin hub">
      {LINKS.filter((l) => !l.admin || admin).map((l) => (
        <Link key={l.href} href={l.href} aria-current={path === l.href ? "page" : undefined}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
