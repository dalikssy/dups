"use client";
import { usePathname } from "next/navigation";

// The marketing site's background field, pixel canvas and cursor effects.
// The admin hub has its own look, so they stay off under /adminhub.
export default function SiteChrome({ children }) {
  const path = usePathname();
  if (path?.startsWith("/adminhub")) return null;
  return children;
}
