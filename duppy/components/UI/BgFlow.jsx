"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Fluid colour field behind the page. Each section carries data-bg;
// whichever section owns the middle of the viewport sets <html data-bg>,
// and the html background (globals.css) blends to that palette.
export default function BgFlow() {
  const path = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.bg = "hero";
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) root.dataset.bg = e.target.dataset.bg;
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    // Observe sections now and whenever the page content is swapped
    // (client-side navigation between /, /en and /cz).
    const seen = new WeakSet();
    const scan = () =>
      document.querySelectorAll("[data-bg]").forEach((e) => {
        if (e !== root && !seen.has(e)) {
          seen.add(e);
          io.observe(e);
        }
      });
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [path]);

  // Phones get a real fixed element (iOS Safari lets a fixed pseudo-element
  // on <html> scroll away, which left colour only at the top of the page).
  return <div className="bgfield" aria-hidden="true" />;
}
