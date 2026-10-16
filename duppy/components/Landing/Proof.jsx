"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./Landing.module.css";
import { Logo } from "../UI/Sprites";

const GLYPHS = "▓▒░█#$%&@*+=/<>0123456789";
const TARGET = 5_000_000_000;

const fmt = (n) => Math.floor(n).toLocaleString("en-US");

// 5B+ and Trusted by: the headline proof of the whole site, so it performs.
// In view: the big number scrambles into place, a live view counter races
// up to 5 billion and then keeps ticking, the label types itself out and the
// client logos pop in one by one.
export default function Proof({ views, trusted, logos }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  const [big, setBig] = useState("5B+");
  const [label, setLabel] = useState(views);
  const [tLabel, setTLabel] = useState(trusted);
  const [count, setCount] = useState(TARGET);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOn(true);
      return;
    }
    setBig("   ");
    setLabel("");
    setTLabel("");
    setCount(0);

    let visible = false, started = false, live = TARGET, raf, tick;
    const timers = [];
    const later = (f, ms) => timers.push(setTimeout(f, ms));

    const type = (text, set, delay, speed = 32) =>
      later(() => {
        let i = 0;
        const step = () => {
          i++;
          set(text.slice(0, i) + (i < text.length ? "▌" : ""));
          if (i < text.length) later(step, speed);
        };
        step();
      }, delay);

    const start = () => {
      started = true;
      setOn(true);
      // big number: glyph noise that resolves left to right
      const final = "5B+";
      const t0 = performance.now();
      const scr = (t) => {
        const p = Math.min(1, (t - t0) / 900);
        const keep = Math.floor(p * (final.length + 1));
        setBig(final.split("").map((c, i) => (i < keep ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join(""));
        if (p < 1) raf = requestAnimationFrame(scr);
        else setBig(final);
      };
      raf = requestAnimationFrame(scr);
      // live counter races to 5 billion, then keeps ticking while on screen
      const c0 = performance.now();
      const race = (t) => {
        const p = Math.min(1, (t - c0) / 2200);
        setCount(TARGET * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(race);
        else
          tick = setInterval(() => {
            if (!visible) return;
            live += 7 + Math.random() * 61;
            setCount(live);
          }, 110);
      };
      requestAnimationFrame(race);
      type(views, setLabel, 350);
      type(trusted, setTLabel, 900, 45);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible && !started) start();
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      clearInterval(tick);
      timers.forEach(clearTimeout);
    };
  }, [views, trusted]);

  return (
    <div ref={ref} className={`${styles.proof} ${on ? styles.proofOn : ""}`}>
      <div className={styles.big}>
        <span className={styles.bigNum} aria-label="5B+">
          {big}
        </span>
        <span className={styles.ticker} aria-hidden="true">
          <i className={styles.liveDot} />
          {fmt(count)}
        </span>
        <span className={`lab ${styles.typed}`}>{label || " "}</span>
      </div>
      <div className={styles.trusted}>
        <span className={`lab ${styles.typed}`}>{tLabel || " "}</span>
        <div className={styles.marquee}>
          <div className={styles.track}>
            {[...logos, ...logos].map((n, i) => (
              <span key={i} className={styles.logoPop} style={{ animationDelay: `${0.9 + (i % logos.length) * 0.12}s` }}>
                <Logo name={n} height={n === "nba" ? 54 : 30} className={styles.logo} />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
