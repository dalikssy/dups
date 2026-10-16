"use client";
import { useEffect } from "react";

// Fluid colour field behind the page. Each section carries data-bg;
// whichever section owns the middle of the viewport sets <html data-bg>,
// and CSS swaps the blob palette + positions with long transitions.
export default function BgFlow() {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.bg = "hero";
    const els = [...document.querySelectorAll("[data-bg]")].filter((e) => e !== root);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) root.dataset.bg = e.target.dataset.bg;
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);

  return (
    <div className="bgflow" aria-hidden="true">
      <i className="b1" />
      <i className="b2" />
      <i className="b3" />
      <i className="b4" />
    </div>
  );
}
