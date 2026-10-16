"use client";

import styles from "./Form.module.css";
import { Logo } from "../UI/Sprites";
import { useState } from "react";
import data from "@/data.json";
import FormDots from "./FormDots";
import getEmail from "@/lib/getEmail";

const { form_title, form_labels, form_placeholders } = data;

const Form = ({ language }) => {
  const [disable, setDisable] = useState(false);
  const [sent, setSent] = useState(false);

  const checkForm = async (e) => {
    setDisable(true);

    const isError = await getEmail(e);

    setSent(isError);
  };

  return (
    <section className={styles.form} id="form">
      <div className={styles.head}>
        <p className="lab">{language === "cz" ? "Kontakt" : "Contact"}</p>
        <h3>{form_title[language]}</h3>
      </div>
      <form action={checkForm}>
        <div className={styles.form_upper}>
          <div className={styles.form_input}>
            <label htmlFor="name">{form_labels[language].name}</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder={form_placeholders[language].name}
              required
            />
          </div>

          <div className={styles.form_input}>
            <label htmlFor="email">{form_labels[language].email}</label>
            <input
              type="text"
              id="email"
              name="email"
              placeholder={form_placeholders[language].email}
              required
            />
          </div>
        </div>

        <div className={styles.form_input}>
          <label htmlFor="message">{form_labels[language].message}</label>
          <textarea
            type="text"
            id="message"
            name="message"
            className={styles.message}
            placeholder={form_placeholders[language].message}
            required
          />
        </div>

        <div className={styles.submit}>
          <FormDots sent={sent} disable={disable} />

          <button
            type="submit"
            value="Submit"
            disabled={disable}
            className={sent ? styles.sent : undefined}
          >
            {sent
              ? form_labels[language].submit.received
              : disable
              ? form_labels[language].submit.sending
              : form_labels[language].submit.submit}
          </button>
        </div>
      </form>

      <Logo name="symbol" height={260} color="rgba(106,69,255,.14)" className={styles.logo} />
    </section>
  );
};

export default Form;
