"use client";
import styles from "./CaseStudy.module.css";
import { useEffect, useRef, useState } from "react";
import { CountUp } from "../UI/Reveal";

const phases = [
  {
    number: "01",
    title: "PHASE 1 — BUILD CREDIBILITY",
    description:
      "We were aware that many fake profiles of Mo existed. From the beginning, our main goal was to establish credibility so people would recognize this as the authentic account. We focused on posting clips mostly featuring Jynxzi, hoping he would repost them and encourage fans to recognize, \"Yes, this is the real account.\"",
    highlight: "Jynxzi",
    stats: [
      { value: "8.5M", label: "VIEWS" },
      { value: "94K", label: "FOLLOWERS" },
      { value: "665K", label: "LIKES" },
    ],
  },
  {
    number: "02",
    title: "PHASE 2 — ANALYZE FANBASE",
    description:
      "After thorough research, we discovered that the client's fanbase wasn't interested in fast editing or flashy titles. On the contrary, they valued raw, authentic gameplay. Our goal was to present the gameplay exactly as it should be, without missing any important details. The results spoke for themselves.",
    highlight: null,
    extra:
      "We launched TikTok live streaming, set everything up, and were ready to go. On a brand-new 12-day-old account, we averaged 21,000 viewers!",
    extraHighlight: ["TikTok live streaming", "averaged 21,000 viewers"],
    stats: [
      { value: "57.5M", label: "VIEWS" },
      { value: "355K", label: "FOLLOWERS" },
      { value: "2.7M", label: "LIKES" },
    ],
  },
];

// Follower count (K) at the end of each day, as shown in the promo.
const DAYS = [0, 5, 12, 22, 35, 52, 72, 94, 120, 150, 185, 225, 265, 310, 350];

function GrowthChart() {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  const W = 640, H = 300, L = 54, R = 20, T = 30, B = 44;
  const x = (d) => L + ((W - L - R) * d) / 14;
  const y = (v) => H - B - ((H - T - B) * v) / 350;
  const pts = DAYS.map((v, d) => `${x(d)},${y(v)}`).join(" ");
  const area = `${x(0)},${y(0)} ${pts} ${x(14)},${y(0)}`;

  return (
    <svg ref={ref} className={`${styles.chart} ${on ? styles.chartOn : ""}`} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Followers grew from 0 to 350K over 14 days">
      <defs>
        <linearGradient id="csArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#73f5f5" stopOpacity=".4" />
          <stop offset="1" stopColor="#73f5f5" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 100, 200, 300].map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,.1)" strokeWidth="1.5" />
          <text x={L - 12} y={y(v) + 5} textAnchor="end" className={styles.axis}>
            {v ? `${v}K` : "0"}
          </text>
        </g>
      ))}
      <line x1={x(7)} x2={x(7)} y1={T - 6} y2={y(0)} stroke="rgba(164,139,255,.5)" strokeDasharray="6 6" />
      <text x={(x(0) + x(7)) / 2} y={T - 10} textAnchor="middle" className={styles.week}>WEEK 1</text>
      <text x={(x(7) + x(14)) / 2} y={T - 10} textAnchor="middle" className={`${styles.week} ${styles.week2}`}>WEEK 2</text>
      {[1, 7, 14].map((d) => (
        <text key={d} x={x(d)} y={H - 14} textAnchor="middle" className={styles.axis}>DAY {d}</text>
      ))}
      <polygon points={area} fill="url(#csArea)" className={styles.area} />
      <polyline points={pts} fill="none" stroke="#73f5f5" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" pathLength="1" className={styles.line} />
      <circle cx={x(14)} cy={y(350)} r="9" fill="#fff" stroke="#73f5f5" strokeWidth="4" className={styles.dot} />
    </svg>
  );
}

export default function CaseStudy({ language }) {
  const [activePhase, setActivePhase] = useState(0);
  const phase = phases[activePhase];

  const renderWithHighlight = (text, highlights) => {
    if (!highlights || highlights.length === 0) return text;
    const parts = [];
    let remaining = text;
    highlights.forEach((h) => {
      const idx = remaining.indexOf(h);
      if (idx !== -1) {
        parts.push(remaining.slice(0, idx));
        parts.push(<span key={h} className={styles.highlight}>{h}</span>);
        remaining = remaining.slice(idx + h.length);
      }
    });
    parts.push(remaining);
    return parts;
  };

  return (
    <section className={styles.casestudy} id="casestudy">
      <div className={styles.header}>
        <div className={styles.meta}>
          <span className="lab">Case study</span>
          <span className={styles.metaDivider} />
          <span className={styles.metaItem}>
            <span className={styles.metaLabel}>Client</span>
            <span className={styles.metaValue}>Mohamed Light</span>
          </span>
          <span className={styles.metaDivider} />
          <span className={styles.metaItem}>
            <span className={styles.metaLabel}>Service</span>
            <span className={styles.metaValue}>Short-form content</span>
          </span>
        </div>
        <h3 className={styles.title}>
          {language === "cz" ? "350K sledujících a 60M zhlédnutí" : "350K followers & 60M views"}
          <br />
          <span className="hl">{language === "cz" ? "za 14 dní" : "in 14 days"}</span>{" "}
          <span className={styles.from}>{language === "cz" ? "— od nuly" : "— from zero"}</span>
        </h3>
      </div>

      <div className={styles.hero}>
        <div className={styles.counter}>
          <span className="lab">{language === "cz" ? "Den 14 / 14" : "Day 14 / 14"}</span>
          <CountUp value="350,000" duration={2200} className={styles.counterNum} />
          <span className={styles.counterLabel}>{language === "cz" ? "Sledujících" : "Followers"}</span>
          <p className={styles.sub}>
            {language === "cz" ? "Úplně nový účet · den 0 → den 14" : "Brand-new account · day 0 → day 14"}
          </p>
        </div>
        <div className={styles.chartCard} data-tilt>
          <GrowthChart />
        </div>
      </div>

      <div className={styles.tabs} role="tablist">
        {phases.map((p, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={activePhase === i}
            className={`${styles.tab} ${activePhase === i ? styles.tabActive : ""}`}
            onClick={() => setActivePhase(i)}
          >
            <span className={styles.tabNum}>{p.number}</span>
            <span className={styles.tabLabel}>{i === 0 ? "Build credibility" : "Analyze fanbase"}</span>
          </button>
        ))}
      </div>

      <div className={styles.content} key={activePhase}>
        <div className={styles.contentLeft}>
          <h2 className={styles.phaseTitle}>{phase.title}</h2>
          <p className={styles.phaseDesc}>
            {phase.highlight ? renderWithHighlight(phase.description, [phase.highlight]) : phase.description}
          </p>
          {phase.extra && (
            <p className={`${styles.phaseDesc} ${styles.phaseExtra}`}>
              {renderWithHighlight(phase.extra, phase.extraHighlight)}
            </p>
          )}
        </div>

        <div className={styles.statsBar}>
          {phase.stats.map((s, i) => (
            <div key={i} className={styles.stat} data-tilt>
              <CountUp value={s.value} className={styles.statValue} />
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.cta}>
        <p className={styles.ctaText}>{language === "cz" ? "Chcete podobné výsledky?" : "Want results like this?"}</p>
        <a className="button" href="https://calendly.com/dupscaled/free-meeting" target="_blank" rel="noreferrer">
          {language === "cz" ? "Sjednat schůzku" : "Book a free call"}
        </a>
      </div>
    </section>
  );
}
