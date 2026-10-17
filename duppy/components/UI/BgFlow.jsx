"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// width only: a touch-screen laptop must still get the moving desktop field
const PHONE = "(max-width: 820px)";

// Colour field behind the page. Each section carries data-bg with its own
// palette (globals.css).
// Desktop: whichever section owns the middle of the viewport sets
// <html data-bg> and the fixed html background blends to that palette.
// Phones: fixed layers break on iOS (they stop above the Safari toolbar and
// read as a separate sheet), so the field is painted once as part of the
// page: every section gets its palette's blobs at its own position, the blobs
// overlap across section borders so colours flow into each other, and the
// whole sheet simply scrolls with the content.
export default function BgFlow() {
  const path = usePathname();
  const field = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    const phone = window.matchMedia(PHONE).matches;
    const sections = () => [...document.querySelectorAll("[data-bg]")].filter((e) => e !== root);

    if (phone) {
      let W = 0, Hdoc = 0, raf;
      const paint = () => {
        const el = field.current;
        if (!el) return;
        const w = root.clientWidth;
        const h = root.scrollHeight;
        if (w === W && Math.abs(h - Hdoc) < 40) return;
        W = w; Hdoc = h;
        // screen height (not the toolbar-dependent viewport) keeps blobs stable
        const vh = Math.max(window.screen.height || 0, window.innerHeight, 640);
        const layers = [];
        sections().forEach((s) => {
          const cs = getComputedStyle(s);
          const c = [1, 2, 3, 4].map((i) => cs.getPropertyValue(`--f${i}`).trim());
          const top = s.getBoundingClientRect().top + window.scrollY;
          const sh = Math.max(s.offsetHeight, vh * 0.8);
          const blob = (rx, ry, x, y, col) =>
            `radial-gradient(${Math.round(rx * w)}px ${Math.round(ry * vh)}px at ${x}% ${Math.round(top + y * sh)}px, color-mix(in srgb, ${col} var(--mix), transparent), transparent 70%)`;
          layers.push(
            blob(1.25, 0.58, 6, 0.16, c[0]),
            blob(1.15, 0.52, 98, 0.36, c[1]),
            blob(1.25, 0.58, 26, 0.86, c[2]),
            blob(1.0, 0.46, 96, 0.7, c[3])
          );
        });
        el.style.height = h + "px";
        el.style.backgroundImage = layers.join(",");
      };
      const schedule = () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(paint);
      };
      paint();
      const ro = new ResizeObserver(schedule);
      ro.observe(document.body);
      // once more after fonts and images have settled
      const t = setTimeout(() => {
        W = 0;
        paint();
      }, 1200);
      return () => {
        ro.disconnect();
        clearTimeout(t);
        cancelAnimationFrame(raf);
      };
    }

    root.dataset.bg = "hero";
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && root.dataset.bg !== e.target.dataset.bg) root.dataset.bg = e.target.dataset.bg;
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    // Observe sections now and whenever the page content is swapped
    // (client-side navigation between /, /en and /cz).
    const seen = new WeakSet();
    const scan = () =>
      sections().forEach((e) => {
        if (!seen.has(e)) {
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

  return <div ref={field} className="bgfield" aria-hidden="true" />;
}
