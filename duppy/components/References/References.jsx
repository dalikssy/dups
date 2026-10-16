"use client";

import styles from "./References.module.css";
import NextArrow from "../UI/NextArrow";
import data from "@/data.json";
import { useState } from "react";
import ReferenceProfile from "./ReferenceProfile";
import Reference from "./Reference";

const { references } = data;

export default function References({ language }) {
  const [refNumber, setRefNumber] = useState(0);
  const prev = () => setRefNumber((n) => (n - 1 + references.length) % references.length);
  const next = () => setRefNumber((n) => (n + 1) % references.length);

  return (
    <div className={styles.references_wrapper} data-bg="refs">
      <p className={`lab ${styles.head}`}>
        {language === "cz" ? "Co říkají klienti" : "What clients say"} · 0{refNumber + 1} / 0
        {references.length}
      </p>

      <ul className={styles.people}>
        {references.map((reference, index) => (
          <Reference
            key={reference.name}
            index={index}
            refer={reference}
            refNumber={refNumber}
            language={language}
          />
        ))}
      </ul>

      <section className={styles.references}>
        <ul className={styles.reference_text_wrapper}>
          {references.map((reference, index) => (
            <ReferenceProfile
              key={reference.name}
              index={index}
              refer={reference}
              refNumber={refNumber}
              language={language}
            />
          ))}
        </ul>

        <div style={{ display: "flex", gap: 12 }}>
          <NextArrow flip onClickFunction={prev} label="Previous" />
          <NextArrow onClickFunction={next} label="Next" />
        </div>
      </section>

      <ul className={styles.reference_text_wrapper_mobile}>
        {references.map((reference, index) => (
          <ReferenceProfile
            key={reference.name}
            index={index}
            refer={reference}
            refNumber={refNumber}
            language={language}
          />
        ))}
      </ul>
    </div>
  );
}
