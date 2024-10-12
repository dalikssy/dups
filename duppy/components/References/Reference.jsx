import Image from "next/image";
import styles from "./References.module.css";

export default function Reference({ refer, language, refNumber, index }) {
  const { name, description, img, link } = refer;

  return (
    <li
      className={`${styles.reference_profile} ${
        refNumber === index ? styles.active : styles.unactive
      }`}
    >
      <a className={styles.img} href={link} target="_blank">
        <Image src={`/referals/${img}`} width={78} height={78} alt={name} />
      </a>
      <div>
        <h4>{name}</h4>
        <p>{description[language]}</p>
      </div>
    </li>
  );
}
