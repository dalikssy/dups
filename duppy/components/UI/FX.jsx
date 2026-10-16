"use client";
import { useEffect, useRef } from "react";

const GLYPHS = "▓▒░█▄▀■□01#$%&@*+=/\\<>";

function scramble(el) {
  if (el.dataset.busy) return;
  const final = el.dataset.text || el.textContent;
  el.dataset.text = final;
  el.dataset.busy = "1";
  // freeze the box so wider glyphs can never re-wrap the line and shift the page
  const r = el.getBoundingClientRect();
  el.style.minHeight = r.height + "px";
  el.style.maxHeight = r.height + "px";
  el.style.overflow = "hidden";
  let f = 0;
  const total = 14;
  const step = () => {
    f++;
    const reveal = Math.floor((f / total) * final.length);
    el.textContent = final
      .split("")
      .map((ch, i) => (ch === " " || i < reveal ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
      .join("");
    if (f < total) requestAnimationFrame(() => setTimeout(step, 28));
    else {
      el.textContent = final;
      el.style.minHeight = el.style.maxHeight = el.style.overflow = "";
      delete el.dataset.busy;
    }
  };
  step();
}

// Global interaction layer: pixel cursor, 3D tilt cards ([data-tilt]),
// magnetic buttons (.button) and text scramble on hover ([data-scramble]).
export default function FX() {
  const dot = useRef(null);
  const box = useRef(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Touch devices: no cursor, no scramble, no random hiccups. They only
    // cost frames while scrolling and can nudge the layout under the finger.
    if (reduce || !fine) return;

    let mx = -100, my = -100, bx = -100, by = -100, raf;
    const root = document.documentElement;
    if (fine) root.classList.add("fx-cursor");

    const loop = () => {
      bx += (mx - bx) * 0.18;
      by += (my - by) * 0.18;
      if (dot.current) dot.current.style.transform = `translate(${mx}px,${my}px)`;
      if (box.current) box.current.style.transform = `translate(${bx}px,${by}px)`;
      raf = requestAnimationFrame(loop);
    };
    if (fine) raf = requestAnimationFrame(loop);

    const onMove = (e) => {
      mx = e.clientX;
      my = e.clientY;

      const t = e.target.closest ? e.target.closest("[data-tilt]") : null;
      document.querySelectorAll("[data-tilt].tilting").forEach((n) => {
        if (n !== t) {
          n.classList.remove("tilting");
          n.style.transform = "";
        }
      });
      if (t && fine) {
        const r = t.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        t.classList.add("tilting");
        t.style.setProperty("--mx", `${px * 100}%`);
        t.style.setProperty("--my", `${py * 100}%`);
        t.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 9}deg) rotateY(${(px - 0.5) * 11}deg) translateY(-4px)`;
      }

      const b = e.target.closest ? e.target.closest(".button, [data-magnet]") : null;
      document.querySelectorAll(".magnet-on").forEach((n) => {
        if (n !== b) {
          n.classList.remove("magnet-on");
          n.style.translate = "";
        }
      });
      if (b && fine) {
        const r = b.getBoundingClientRect();
        b.classList.add("magnet-on");
        b.style.translate = `${(e.clientX - r.left - r.width / 2) * 0.22}px ${(e.clientY - r.top - r.height / 2) * 0.3}px`;
      }

      const hot = e.target.closest ? e.target.closest("a,button,[data-tilt],[role=tab],label,input,textarea") : null;
      if (box.current) box.current.classList.toggle("fx-hot", !!hot);
    };

    const onOver = (e) => {
      const s = e.target.closest ? e.target.closest("[data-scramble]") : null;
      if (s && !s.contains(e.relatedTarget)) scramble(s);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver);

    // Every so often something on screen hiccups for a split second.
    const POOL = "h1 [class*=ltr], h2, h3, .lab, [data-scramble], [data-tilt], .button, img";
    let glitchTimer;
    const inView = (el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
    };
    const hiccup = () => {
      if (!document.hidden && !document.querySelector(".hello")) {
        const els = [...document.querySelectorAll(POOL)].filter(inView);
        if (els.length) {
          const el = els[(Math.random() * els.length) | 0];
          if (el.hasAttribute("data-scramble") && Math.random() < 0.5) scramble(el);
          else {
            el.classList.add("micro-glitch");
            setTimeout(() => el.classList.remove("micro-glitch"), 340);
          }
        }
      }
      glitchTimer = setTimeout(hiccup, 4500 + Math.random() * 6000);
    };
    glitchTimer = setTimeout(hiccup, 5000);

    return () => {
      clearTimeout(glitchTimer);
      cancelAnimationFrame(raf);
      root.classList.remove("fx-cursor");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
    };
  }, []);

  return (
    <>
      <div ref={box} className="fx-box" aria-hidden="true" />
      <div ref={dot} className="fx-dot" aria-hidden="true" />
    </>
  );
}
