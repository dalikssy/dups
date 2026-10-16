import styles from "./Landing.module.css";

import SchedulePopUp from "./SchedulePopUp";
import Navbar from "../Navbar/Navbar";
import data from "@/data.json";
import { ReelButton } from "./HeroMedia";
import { Logo, Pixel } from "../UI/Sprites";
import { ROSTER } from "@/lib/media";

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
  kicker: { en: "Shortform content agency", cz: "Agentura na shortform obsah" },
  reel: { en: "Watch the reel", cz: "Pustit showreel" },
  views: { en: "Views generated", cz: "Vygenerovaných zhlédnutí" },
  trusted: { en: "Trusted by", cz: "Důvěřují nám" },
};

const TRUSTED = ["gamdom", "nba", "ewc", "livesport", "mag", "forbes"];

const Landing = ({ language }) => {
  const [before, after] = title[language].split("DUPSCALED");

  return (
    <section className={styles.landing}>
      <SchedulePopUp language={language} />
      <Navbar language={language} />

      <div className={styles.heroWrap}>
      <div className={styles.hero}>
        <p className={`lab ${styles.kicker}`} data-scramble>{COPY.kicker[language]}</p>
        <h1 aria-label={title[language]}>
          <span aria-hidden="true">
            {before.trim().split("").map((ch, i) => (
              <span key={i} className={styles.ltr}>
                {ch === " " ? "\u00a0" : ch}
              </span>
            ))}
            <br />
            <span className={`glitch ${styles.brand}`} data-text="DUPSCALED">
              {"DUPSCALED".split("").map((ch, i) => (
                <span key={i} className={styles.ltr}>
                  {ch}
                </span>
              ))}
            </span>
            {after}
          </span>
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
          <a className={styles.reference} href="#references" data-scramble>
            {main_references[language]} ↓
          </a>
        </div>
      </div>

      <div className={styles.stack} aria-hidden="true">
        {[0, 2, 10, 1].map((ix, i) => (
          <div key={ix} className={`${styles.tile} ${styles["t" + i]}`} data-tilt>
            <Pixel index={ix} size={200} />
            <span>{ROSTER[ix]}</span>
          </div>
        ))}
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
