import Image from "next/image";
import styles from "./Footer.module.css";
import { Logo } from "../UI/Sprites";

const Footer = ({ language }) => {
  return (
    <footer>
      <div className={styles.brand}>
        <Logo name="symbol" height={30} color="var(--brand)" />
        <div>
          <Logo name="wordmark" height={16} />
          <p className={styles.copy}>
            © {new Date().getFullYear()} DUPSCALED ·{" "}
            {language === "cz" ? "All in one content & brand agency." : "All in one content & brand agency."}
          </p>
        </div>
      </div>

      <div className={styles.socials}>
        <a className={styles.portal} href="/onboarding" data-scramble>
          {language === "cz" ? "Klientský portál" : "Client portal"}
        </a>
        <a
          className={styles.socail}
          href="https://www.twitter.com/dupscaled"
          target="_blank"
          rel="noreferrer"
          aria-label="DUPSCALED on X"
        >
          <Image src={"/socials/twitter.svg"} width={19} height={19} alt="" />
        </a>

        <a
          className={styles.socail}
          href="https://www.instagram.com/dupscaledagency"
          target="_blank"
          rel="noreferrer"
          aria-label="DUPSCALED on Instagram"
        >
          <Image src={"/socials/instagram.svg"} width={19} height={19} alt="" />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
