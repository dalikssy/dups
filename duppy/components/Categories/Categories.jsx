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
