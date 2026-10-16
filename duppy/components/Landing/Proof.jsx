"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./Landing.module.css";
import { Logo } from "../UI/Sprites";

const START = 5_000_000_000;
const DIGITS = "0123456789".split("");

// One rolling digit column (odometer). Only transforms move, so it is cheap.
function Wheel({ d, delay, slow }) {
  return (
    <span className={styles.wheel}>
      <span
        className={styles.wheelCol}
        style={{
          transform: `translateY(${-d * 10}%)`,
          transitionDuration: slow ? "1.6s" : "0.7s",
          transitionDelay: slow ? `${delay}ms` : "0ms",
        }}
      >
        {DIGITS.map((n) => (
          <span key={n}>{n}</span>
        ))}
      </span>
    </span>
  );
}

// Headline proof: total views generated for clients as a live counter.
// Scrolls into view -> every digit spins up from zero, left to right; then the
// number keeps ticking upward like a live stream stat while it is on screen.
export default function Proof({ views, trusted, logos }) {
  const ref = useRef(null);
  const [n, setN] = useState(9_999_999_999); // every wheel starts on 9 so all of them spin in
  const [intro, setIntro] = useState(true);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let visible = false, started = false, value = START, tick, t1;
    const run = () => {
      started = true;
      setOn(true);
      value = START + 100 + Math.floor(Math.random() * 800);
      setN(value);
      t1 = setTimeout(() => {
        setIntro(false);
        tick = setInterval(() => {
          if (!visible || document.hidden) return;
          value += 60 + Math.floor(Math.random() * 540);
          setN(value);
        }, 1100);
      }, 2600);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible && !started) run();
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(tick);
      clearTimeout(t1);
    };
  }, []);

  const txt = n.toLocaleString("en-US").padStart(13, "0");
  let di = 0;

  return (
    <div ref={ref} className={`${styles.proof} ${on ? styles.proofOn : ""}`}>
      <div className={styles.counterCard}>
        <span className={styles.livePill}>
          <i /> LIVE
        </span>
        <span className={styles.odo} aria-label={`${START.toLocaleString("en-US")}+`}>
          {txt.split("").map((c, i) =>
            c === "," ? (
              <span key={i} className={styles.comma}>
                ,
              </span>
            ) : (
              <Wheel key={i} d={+c} delay={di++ * 70} slow={intro} />
            )
          )}
        </span>
        <span className={styles.odoLabel}>{views}</span>
      </div>
      <div className={styles.trusted}>
        <span className="lab">{trusted}</span>
        <div className={styles.marquee}>
          <div className={styles.track}>
            {[...logos, ...logos].map((name, i) => (
              <span key={i} className={styles.logoPop} style={{ animationDelay: `${0.4 + (i % logos.length) * 0.12}s` }}>
                <Logo name={name} height={name === "nba" ? 54 : 30} className={styles.logo} />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
