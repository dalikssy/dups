"use client";
import styles from "./CaseStudy.module.css";
import { useState } from "react";
import { renderText } from "@/lib/utils";

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

export default function CaseStudy({ language }) {
  const [activePhase, setActivePhase] = useState(0);

  const phase = phases[activePhase];

  const renderWithHighlight = (text, highlights) => {
    if (!highlights || highlights.length === 0) return text;
    let result = text;
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
      {/* Top border line like other sections */}
      <div className={styles.topLine} />

      <div className={styles.header}>
        <div className={styles.tag}>CASE STUDY</div>
        <h3 className={styles.title}>
          350K Followers & 60M Views{" "}
          <span className={styles.cyan}>in 14 Days</span>
          <br />
          — From Zero
        </h3>
        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <span className={styles.metaLabel}>CLIENT</span>
            <span className={styles.metaValue}>MOHAMED LIGHT</span>
          </span>
          <span className={styles.metaDivider} />
          <span className={styles.metaItem}>
            <span className={styles.metaLabel}>SERVICE</span>
            <span className={styles.metaValue}>SHORTFORM CONTENT</span>
          </span>
        </div>
      </div>

      {/* Phase tabs */}
      <div className={styles.tabs}>
        {phases.map((p, i) => (
          <button
            key={i}
            className={`${styles.tab} ${activePhase === i ? styles.tabActive : ""}`}
            onClick={() => setActivePhase(i)}
          >
            <span className={styles.tabNum}>{p.number}</span>
            <span className={styles.tabLabel}>
              {i === 0 ? "Build Credibility" : "Analyze Fanbase"}
            </span>
          </button>
        ))}
      </div>

      {/* Phase content */}
      <div className={styles.content}>
        <div className={styles.contentLeft}>
          <h2 className={styles.phaseTitle}>{phase.title}</h2>
          <p className={styles.phaseDesc}>
            {phase.highlight
              ? renderWithHighlight(phase.description, [phase.highlight])
              : phase.description}
          </p>
          {phase.extra && (
            <p className={`${styles.phaseDesc} ${styles.phaseExtra}`}>
              {renderWithHighlight(phase.extra, phase.extraHighlight)}
            </p>
          )}
        </div>

        {/* Stats bar */}
        <div className={styles.statsBar}>
          {phase.stats.map((s, i) => (
            <div key={i} className={styles.stat}>
              <span className={styles.statValue}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className={styles.cta}>
        <p className={styles.ctaText}>
          Want results like this?
        </p>
        <a
          className="button"
          href="https://calendly.com/dupscaled/free-meeting"
          target="_blank"
        >
          {language === "cz" ? "Sjednat Schůzku" : "Book a free call"}
        </a>
      </div>

      <div className={styles.glow} />
    </section>
  );
}
