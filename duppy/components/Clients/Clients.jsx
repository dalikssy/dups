import data from "@/data.json";
import styles from "./Clients.module.css";
import { renderText } from "@/lib/utils";
import { Pixel } from "../UI/Sprites";
import { ROSTER } from "@/lib/media";
import ClientPicker from "./ClientPicker";

const { clients, clients_title, clients_highlight } = data;

const Clients = ({ language }) => {
  return (
    <section className={styles.reference} id="references" data-bg="clients">
      <div className={styles.head}>
        <p className="lab" data-scramble>{language === "cz" ? "Klienti" : "Clients"}</p>
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

      <ClientPicker language={language} />

    </section>
  );
};

export default Clients;
