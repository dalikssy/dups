"use client";
import { usePathname } from "next/navigation";

// The marketing site's background field, pixel canvas and cursor effects.
// The admin hub has its own look, so they stay off there, on audit pages and in the client portal.
export default function SiteChrome({ children }) {
  const path = usePathname();
  if (["/adminhub", "/a/", "/portal"].some((p) => path?.startsWith(p))) return null;
  return children;
}
