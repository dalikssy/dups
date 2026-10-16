"use client";
import { useEffect, useRef } from "react";

const PALETTE = {
  dark: ["#73f5f5", "#6a45ff", "#a48bff", "#ffffff"],
  light: ["#6a45ff", "#0b8b93", "#a48bff", "#2a1170"],
};

// Full-screen canvas of drifting pixels. Pixels flee the cursor,
// and a click/tap blows a burst of new ones out of that spot.
export default function PixelField() {
  const ref = useRef(null);

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Phones: fewer pixels, 30 fps, no finger repel (it fought with scrolling).
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    let W = 0, H = 0, dpr = 1, raf, running = true, last = 0, scrolledAt = 0;
    const onScroll = () => { scrolledAt = performance.now(); };
    const mouse = { x: -9999, y: -9999, vx: 0, vy: 0 };
    let P = [];

    const spawn = (x, y, burst) => {
      const s = [3, 4, 6, 8, 10][(Math.random() * (burst ? 5 : 4)) | 0];
      const a = Math.random() * Math.PI * 2, sp = burst ? 3 + Math.random() * 7 : 0;
      return {
        x, y, s,
        vx: burst ? Math.cos(a) * sp : (Math.random() - 0.5) * 0.25,
        vy: burst ? Math.sin(a) * sp : -0.15 - Math.random() * 0.55,
        ci: (Math.random() * 4) | 0,
        o: burst ? 0.5 + Math.random() * 0.4 : 0.18 + Math.random() * 0.42,
        life: burst ? 70 + Math.random() * 50 : Infinity,
        tw: Math.random() * Math.PI * 2,
      };
    };

    const resize = () => {
      const w = window.innerWidth;
      // Mobile toolbars change the height on every scroll: never respawn for
      // that, only grow the canvas so pixels keep flying where they were.
      const h = coarse ? Math.max(H, window.innerHeight, Math.round(window.screen.height || 0)) : window.innerHeight;
      if (w === W && h === H) return;
      const fresh = w !== W;
      dpr = coarse ? 1 : Math.min(2, window.devicePixelRatio || 1);
      W = w; H = h;
      cv.width = W * dpr; cv.height = H * dpr;
      cv.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (fresh) {
        const n = Math.round(Math.min(coarse ? 18 : 80, (W * H) / (coarse ? 26000 : 20000)));
        P = Array.from({ length: n }, () => spawn(Math.random() * W, Math.random() * H));
      }
    };

    const onMove = (e) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      const t = e.touches ? e.touches[0] : e;
      mouse.vx = t.clientX - mouse.x; mouse.vy = t.clientY - mouse.y;
      mouse.x = t.clientX; mouse.y = t.clientY;
    };
    const onLeave = () => { mouse.x = mouse.y = -9999; };
    // A real click/tap (not the start of a scroll) blows a burst of pixels.
    const onDown = (e) => {
      if (e.target.closest && e.target.closest("a,button,input,textarea,label,select")) return;
      for (let i = 0; i < (coarse ? 12 : 18); i++) P.push(spawn(e.clientX, e.clientY, true));
    };
    const onVis = () => {
      running = !document.hidden;
      if (running) { cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); }
    };

    const tick = (now) => {
      if (!running) return;
      // phones: hold the frame while the user is scrolling, then resume
      if (coarse && (now - last < 32 || now - scrolledAt < 180)) {
        raf = requestAnimationFrame(tick);
        return;
      }
      last = now;
      ctx.clearRect(0, 0, W, H);
      const pal = document.documentElement.dataset.theme === "dark" ? PALETTE.dark : PALETTE.light;
      for (let i = P.length - 1; i >= 0; i--) {
        const p = P[i];
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 140 * 140) {
          const d = Math.sqrt(d2) || 1, f = (1 - d / 140) * 1.6;
          p.vx += (dx / d) * f + mouse.vx * 0.02;
          p.vy += (dy / d) * f + mouse.vy * 0.02;
        }
        if (p.life === Infinity) {
          p.vx += ((Math.random() - 0.5) * 0.25 - p.vx) * 0.04;
          p.vy += (-0.15 - p.vy * 1) * 0.02;
        } else {
          p.vx *= 0.94; p.vy = p.vy * 0.94 + 0.05; p.life--;
        }
        p.x += p.vx; p.y += p.vy; p.tw += 0.05;
        if (p.life <= 0) { P.splice(i, 1); continue; }
        if (p.life === Infinity) {
          if (p.y < -12) { p.y = H + 10; p.x = Math.random() * W; }
          if (p.x < -12) p.x = W + 10; else if (p.x > W + 12) p.x = -10;
        }
        const fade = p.life === Infinity ? 1 : Math.min(1, p.life / 40);
        ctx.globalAlpha = p.o * fade * (0.7 + 0.3 * Math.sin(p.tw));
        ctx.fillStyle = pal[p.ci];
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
      }
      ctx.globalAlpha = 1;
      mouse.vx *= 0.8; mouse.vy *= 0.8;
      raf = requestAnimationFrame(tick);
    };

    resize();
    if (reduce) {
      // static scatter only
      P.forEach((p) => { ctx.globalAlpha = p.o * 0.6; ctx.fillStyle = PALETTE.light[p.ci]; ctx.fillRect(p.x, p.y, p.s, p.s); });
      return;
    }
    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("click", onDown, { passive: true });
    if (coarse) window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("click", onDown);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 0, pointerEvents: "none" }}
    />
  );
}
