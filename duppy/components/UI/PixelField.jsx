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
    let W = 0, H = 0, dpr = 1, raf, running = true;
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
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(80, (W * H) / 20000));
      P = Array.from({ length: n }, () => spawn(Math.random() * W, Math.random() * H));
    };

    const onMove = (e) => {
      const t = e.touches ? e.touches[0] : e;
      mouse.vx = t.clientX - mouse.x; mouse.vy = t.clientY - mouse.y;
      mouse.x = t.clientX; mouse.y = t.clientY;
    };
    const onLeave = () => { mouse.x = mouse.y = -9999; };
    const onDown = (e) => {
      if (e.target.closest && e.target.closest("a,button,input,textarea,label")) return;
      const t = e.touches ? e.touches[0] : e;
      for (let i = 0; i < 18; i++) P.push(spawn(t.clientX, t.clientY, true));
    };
    const onVis = () => {
      running = !document.hidden;
      if (running) { cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); }
    };

    const tick = () => {
      if (!running) return;
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
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", zIndex: 0, pointerEvents: "none" }}
    />
  );
}
