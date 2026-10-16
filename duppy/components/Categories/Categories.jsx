"use client";
import { useState } from "react";
import { renderText } from "@/lib/utils";
import styles from "./Categories.module.css";
import data from "@/data.json";
import Reveal from "../UI/Reveal";

const { categories_title, categories_description } = data;
const KEYS = ["content", "brand", "social", "web"];

const Categories = ({ language }) => {
  const [sel, setSel] = useState(0);

  // Jump to the form with the chosen service already written in.
  const ask = (k) => {
    const name = categories_title[language][k].replace(/<br>/g, " ");
    const msg = document.getElementById("message");
    if (msg && !msg.value.trim()) {
      msg.value = language === "cz" ? `Mám zájem o: ${name}\n\n` : `I'm interested in: ${name}\n\n`;
    }
    setTimeout(() => msg && msg.focus({ preventScroll: true }), 700);
  };

  return (
    <section className={styles.categories} id="services" data-bg="services">
      <div className={styles.head}>
        <p className="lab" data-scramble>{language === "cz" ? "Co děláme" : "What we do"}</p>
        <h3>
          {language === "cz" ? (
            <>
              Vše pro vaši značku. <span className="hl">Jeden tým.</span>
            </>
          ) : (
            <>
              Everything your brand needs. <span className="hl">One team.</span>
            </>
          )}
        </h3>
      </div>

      <div className={`chips ${styles.tabs}`} role="tablist">
        {KEYS.map((k, i) => (
          <button key={k} role="tab" className="chip" aria-selected={sel === i} onClick={() => setSel(i)}>
            0{i + 1} · {categories_title[language][k].replace(/<br>/g, " ")}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {KEYS.map((k, i) => (
          <Reveal key={k} delay={i * 110} className={`${styles.category} ${sel === i ? styles.on : ""}`} data-tilt>
            <button type="button" className={styles.row} onClick={() => setSel(sel === i ? -1 : i)} aria-expanded={sel === i}>
              <span className={styles.num}>0{i + 1}</span>
              <h2>{renderText(categories_title[language][k])}</h2>
              <span className={styles.plus} aria-hidden="true" />
            </button>
            <p>{renderText(categories_description[language][k])}</p>
            <a className={styles.ask} href="#form" onClick={() => ask(k)} data-magnet>
              {language === "cz" ? "Chci nabídku" : "Get a quote"} <span aria-hidden="true">→</span>
            </a>
          </Reveal>
        ))}
      </div>
    </section>
  );
};

export default Categories;
