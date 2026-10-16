"use client";
import { useState } from "react";
import { renderText } from "@/lib/utils";
import styles from "./Categories.module.css";
import data from "@/data.json";
import Reveal from "../UI/Reveal";

const { categories_title, categories_description } = data;
const KEYS = ["media", "editing", "design"];

const Categories = ({ language }) => {
  const [sel, setSel] = useState(0);
  return (
    <section className={styles.categories} id="services">
      <div className={styles.head}>
        <p className="lab">{language === "cz" ? "Co děláme" : "What we do"}</p>
        <h3>
          {language === "cz" ? (
            <>
              Obsah, který <span className="hl">roste.</span>
            </>
          ) : (
            <>
              Content that <span className="hl">scales.</span>
            </>
          )}
        </h3>
      </div>

      <div className={`chips ${styles.tabs}`} role="tablist">
        {KEYS.map((k, i) => (
          <button key={k} role="tab" className="chip" aria-selected={sel === i} onClick={() => setSel(i)}>
            0{i + 1} · {categories_title[language][k].replace("<br>", " ")}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {KEYS.map((k, i) => (
          <Reveal key={k} delay={i * 110} className={`${styles.category} ${sel === i ? styles.on : ""}`} data-tilt>
            <span className={styles.num}>0{i + 1}</span>
            <h2>{renderText(categories_title[language][k])}</h2>
            <p>{renderText(categories_description[language][k])}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
};

export default Categories;
