"use client";
import { useEffect, useRef, useState } from "react";
import { renderText } from "@/lib/utils";
import styles from "./Categories.module.css";
import data from "@/data.json";
import Reveal from "../UI/Reveal";

const { categories_title, categories_description } = data;
const KEYS = ["content", "brand", "social", "web"];

const Categories = ({ language }) => {
  const [sel, setSel] = useState(0);
  // phones: picker + one big panel that rotates on its own until tapped
  const [pick, setPick] = useState(0);
  const [auto, setAuto] = useState(true);
  const mob = useRef(null);

  useEffect(() => {
    if (!auto || !mob.current) return;
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.4 });
    io.observe(mob.current);
    const t = setInterval(() => visible && setPick((p) => (p + 1) % KEYS.length), 4500);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, [auto]);

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
      <div className={styles.mob} ref={mob}>
        <div className={styles.picker} role="tablist">
          {KEYS.map((k, i) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={pick === i}
              className={`${styles.pick} ${pick === i ? styles.pickOn : ""}`}
              onClick={() => {
                setPick(i);
                setAuto(false);
              }}
            >
              <span className={styles.pickNum}>0{i + 1}</span>
              <span className={styles.pickName}>{categories_title[language][k].replace(/<br>/g, " ")}</span>
              {auto && pick === i && <i className={styles.pickBar} />}
            </button>
          ))}
        </div>
        <div className={styles.panel} key={pick}>
          <h2>{categories_title[language][KEYS[pick]].replace(/<br>/g, " ")}</h2>
          <p>{renderText(categories_description[language][KEYS[pick]])}</p>
          <a className={styles.ask} href="#form" onClick={() => ask(KEYS[pick])}>
            {language === "cz" ? "Chci nabídku" : "Get a quote"} <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Categories;
