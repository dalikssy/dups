import styles from "./Landing.module.css";

import SchedulePopUp from "./SchedulePopUp";
import Navbar from "../Navbar/Navbar";
import data from "@/data.json";
import { HeroVideo, ReelButton } from "./HeroMedia";
import { Logo } from "../UI/Sprites";

const renderText = (text) => {
  return text.map((item, index) => {
    if (item.type === "span") {
      return (
        <span key={index} className={item.className}>
          {item.text}
        </span>
      );
    }
    return item.text;
  });
};

const { main_text, title, main_book, main_references } = data;

const COPY = {
  kicker: { en: "Short-form content agency", cz: "Agentura na short-form obsah" },
  reel: { en: "Watch the reel", cz: "Pustit showreel" },
  views: { en: "Views generated", cz: "Vygenerovaných zhlédnutí" },
  trusted: { en: "Trusted by", cz: "Důvěřují nám" },
};

const TRUSTED = ["gamdom", "nba", "ewc", "livesport", "mag", "forbes"];

const Landing = ({ language }) => {
  const [before, after] = title[language].split("DUPSCALED");

  return (
    <section className={styles.landing}>
      <div className={styles.media} aria-hidden="true">
        <HeroVideo />
        <div className={styles.shade} />
      </div>

      <SchedulePopUp language={language} />
      <Navbar language={language} />

      <div className={styles.hero}>
        <p className={`lab ${styles.kicker}`}>{COPY.kicker[language]}</p>
        <h1>
          {before}
          <br />
          <span className={`glitch ${styles.brand}`} data-text="DUPSCALED">
            DUPSCALED
          </span>
          {after}
        </h1>

        <p className={styles.main_text}>{renderText(main_text[language])}</p>

        <div className={styles.buttons}>
          <a
            className="button"
            href="https://calendly.com/dupscaled/free-meeting"
            target="_blank"
            rel="noreferrer"
          >
            {main_book[language]}
          </a>
          <ReelButton label={COPY.reel[language]} />
          <a className={styles.reference} href="#references">
            {main_references[language]} <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>

      <div className={styles.proof}>
        <div className={styles.big}>
          <span className={styles.bigNum}>5B+</span>
          <span className="lab">{COPY.views[language]}</span>
        </div>
        <div className={styles.trusted}>
          <span className="lab">{COPY.trusted[language]}</span>
          <div className={styles.marquee}>
            <div className={styles.track}>
              {[...TRUSTED, ...TRUSTED].map((n, i) => (
                <Logo key={i} name={n} height={n === "nba" ? 54 : 30} className={styles.logo} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Landing;
