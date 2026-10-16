"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Fluid colour field behind the page. Each section carries data-bg;
// whichever section owns the middle of the viewport sets <html data-bg>,
// and CSS swaps the blob palette + positions with long transitions.
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

  return (
    <div className="bgflow" aria-hidden="true">
      <i className="b1" />
      <i className="b2" />
      <i className="b3" />
      <i className="b4" />
    </div>
  );
}
