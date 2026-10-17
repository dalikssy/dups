import styles from "./Landing.module.css";

import SchedulePopUp from "./SchedulePopUp";
import HelloPopup from "../UI/HelloPopup";
import Navbar from "../Navbar/Navbar";
import data from "@/data.json";
import { ReelButton } from "./HeroMedia";
import Proof from "./Proof";
import { Logo, Pixel } from "../UI/Sprites";
import { ROSTER, PX_KEYIN } from "@/lib/media";

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
  kicker: { en: "All in one content & brand agency", cz: "All in one content & brand agency" },
  reel: { en: "Watch the reel", cz: "Pustit showreel" },
  views: { en: "views generated for our clients", cz: "zhlédnutí, která jsme vygenerovali klientům" },
  short: { en: "Views generated", cz: "Vygenerovaných zhlédnutí" },
  trusted: { en: "Trusted by", cz: "Důvěřují nám" },
};

const TRUSTED = ["gamdom", "nba", "ewc", "livesport", "mag", "forbes"];

const TILE_CLASS = [styles.t0, styles.t1, styles.t2, styles.t3, styles.t4];

function Tiles({ dup }) {
  const cls = (i) => `${styles.tile} ${TILE_CLASS[i]} ${dup ? styles.dup : ""}`;
  return (
    <>
      <div className={cls(0)} data-tilt>
        <Pixel index={0} size={200} />
        <span>{ROSTER[0]}</span>
      </div>
      <div className={cls(1)} data-tilt>
        <span className={styles.brandTile}>
          <Logo name="livesport" height={22} color="#fff" />
        </span>
        <span>LIVESPORT</span>
      </div>
      <div className={cls(2)} data-tilt>
        <Pixel index={10} size={200} />
        <span>{ROSTER[10]}</span>
      </div>
      <div className={cls(3)} data-tilt>
        <span className={styles.keyin} style={{ backgroundImage: `url(${PX_KEYIN})` }} role="img" aria-label="Keyin" />
        <span>KEYIN</span>
      </div>
      <div className={cls(4)} data-tilt>
        <Pixel index={9} size={200} />
        <span>{ROSTER[9]}</span>
      </div>
    </>
  );
}

const Landing = ({ language }) => {
  const [before, after] = title[language].split("DUPSCALED");

  return (
    <section className={styles.landing} data-bg="hero">
      <SchedulePopUp language={language} />
      <HelloPopup language={language} />
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
        {/* phones: the tiles roll by on their own; the copy closes the loop */}
        <div className={styles.stackTrack}>
          {[0, 1].map((copy) => (
            <Tiles key={copy} dup={copy === 1} />
          ))}
        </div>
      </div>
      </div>

      <Proof views={COPY.views[language]} short={COPY.short[language]} trusted={COPY.trusted[language]} logos={TRUSTED} />
    </section>
  );
};

export default Landing;
