"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// 24px line icons, one path each
const LINKS = [
  { href: "/adminhub", label: "Pipeline", icon: "M4 6h4v12H4zM10 6h4v8h-4zM16 6h4v5h-4z" },
  { href: "/adminhub/leads", label: "Lead finder", icon: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4" },
  { href: "/adminhub/clients", label: "Clients", icon: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14.5c1.8.9 3 2.9 3 5.5" },
  { href: "/adminhub/pricing", label: "Pricing", admin: true, icon: "M4 5h16v14H4zM8 9h8M8 13h5M16 15.5h.01" },
  { href: "/adminhub/finance", label: "Finance", admin: true, icon: "M4 19V9M10 19V5M16 19v-7M21 19H3" },
  { href: "/adminhub/settings", label: "Settings", admin: true, icon: "M4 7h10M18 7h2M4 17h2M10 17h10M16 5v4M8 15v4" },
];

export default function Nav({ admin }) {
  const path = usePathname();
  return (
    <nav className="hub-nav" aria-label="Admin hub">
      {LINKS.filter((l) => !l.admin || admin).map((l) => (
        <Link key={l.href} href={l.href} aria-current={path === l.href || (l.href !== "/adminhub" && path.startsWith(l.href + "/")) ? "page" : undefined}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={l.icon} />
          </svg>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
