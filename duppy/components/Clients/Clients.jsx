import data from "@/data.json";
import styles from "./Clients.module.css";
import Client from "./Client";
import { renderText } from "@/lib/utils";
import { Pixel } from "../UI/Sprites";
import { ROSTER } from "@/lib/media";
import Reveal from "../UI/Reveal";

const { clients, clients_title, clients_highlight } = data;

const Clients = ({ language }) => {
  return (
    <section className={styles.reference} id="references">
      <div className={styles.head}>
        <p className="lab">{language === "cz" ? "Spolupracovali jsme s" : "We worked with"}</p>
        <h3>{renderText(clients_title[language])}</h3>
      </div>

      <div className={styles.roster} aria-label="Creators we worked with">
        <div className={styles.rosterTrack}>
          {[...ROSTER, ...ROSTER].map((name, i) => (
            <figure key={i} className={styles.person} aria-hidden={i >= ROSTER.length}>
              <Pixel index={i % ROSTER.length} size={168} className={styles.px} />
              <figcaption>{name}</figcaption>
            </figure>
          ))}
        </div>
      </div>

      <ul className={styles.clients}>
        {clients.map((clientData, index) => (
          <Reveal as="li" key={index} delay={(index % 4) * 70} className={styles.cell}>
            <Client clientData={clientData} index={index} language={language} />
          </Reveal>
        ))}
      </ul>

      <p className={styles.reference_side}>{clients_highlight[language]}</p>
    </section>
  );
};

export default Clients;
