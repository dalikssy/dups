"use client";
import { useEffect, useRef, useState } from "react";

// Fades its children in once they scroll into view.
export default function Reveal({ as: Tag = "div", className = "", delay = 0, children, ...rest }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${on ? "in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// Counts up to a value like "57.5M" / "355K" / "21,000" once visible.
export function CountUp({ value, duration = 1400, className }) {
  const ref = useRef(null);
  const m = String(value).match(/^([^\d]*)([\d.,]+)(.*)$/);
  const prefix = m ? m[1] : "";
  const raw = m ? m[2] : "0";
  const suffix = m ? m[3] : "";
  const target = parseFloat(raw.replace(/,/g, ""));
  const decimals = raw.includes(".") ? raw.split(".")[1].length : 0;
  const comma = raw.includes(",");
  const [n, setN] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || !m) return;
    let raf;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduce) return setN(target);
        const t0 = performance.now();
        const tick = (t) => {
          const p = Math.min(1, (t - t0) / duration);
          const k = 1 - Math.pow(1 - p, 3);
          setN(target * k);
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!m) return <span className={className}>{value}</span>;
  let txt = n.toFixed(decimals);
  if (comma) txt = Math.round(n).toLocaleString("en-US");
  return (
    <span ref={ref} className={className} aria-label={String(value)}>
      {prefix}
      {txt}
      {suffix}
    </span>
  );
}
