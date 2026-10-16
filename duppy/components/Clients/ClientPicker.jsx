"use client";
import { useState } from "react";
import data from "@/data.json";
import styles from "./Clients.module.css";
import Client from "./Client";

const { clients } = data;

// Desktop: grid of tilt cards. Phone: pick a name, see one card.
export default function ClientPicker({ language }) {
  const [sel, setSel] = useState(0);

  return (
    <div className={styles.picker}>
      <div className={`chips ${styles.chipRow}`} role="tablist" aria-label="Clients">
        {clients.map((c, i) => (
          <button
            key={c.name}
            role="tab"
            className="chip"
            aria-selected={sel === i}
            onClick={() => setSel(i)}
          >
            {c.name}
          </button>
        ))}
      </div>

      <ul className={styles.clients}>
        {clients.map((clientData, index) => (
          <li
            key={index}
            className={`${styles.cell} ${sel === index ? styles.cellOn : ""}`}
            role="tabpanel"
          >
            <Client clientData={clientData} index={index} language={language} />
          </li>
        ))}
      </ul>

      <p className={styles.swipeHint}>{language === "cz" ? "← Swipe → " : "← Swipe →"} · {clients.length}</p>

      <div className={styles.pager}>
        <button onClick={() => setSel((sel - 1 + clients.length) % clients.length)} aria-label="Previous">←</button>
        <span>
          {String(sel + 1).padStart(2, "0")} / {clients.length}
        </span>
        <button onClick={() => setSel((sel + 1) % clients.length)} aria-label="Next">→</button>
      </div>
    </div>
  );
}
