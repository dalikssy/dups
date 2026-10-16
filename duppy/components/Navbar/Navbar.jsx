import styles from "./Navbar.module.css";
import Link from "next/link";
import data from "@/data.json";
import { Logo } from "../UI/Sprites";
import ThemeToggle from "../UI/ThemeToggle";
import MobileMenu from "./MobileMenu";

export default function Navbar({ language }) {
  const { navbar } = data;

  return (
    <header className={styles.header}>
      <Link href={language === "cz" ? "/cz" : "/"} className={styles.brand} aria-label="DUPSCALED home">
        <Logo name="symbol" height={22} color="var(--brand)" />
        <Logo name="wordmark" height={15} className={styles.wordmark} />
      </Link>

      <nav className={styles.nav}>
        <a className={styles.link} href="#casestudy" data-scramble>
          Case study
        </a>
        <a className={styles.link} href="#form" data-scramble>
          {navbar[language]}
        </a>

        <a href="/onboarding" className={styles.portalBtn}>
          {language === "cz" ? "Klientský portál" : "Client portal"}
        </a>

        <div className={styles.language}>
          <Link href="/en" className={language == "en" ? styles.activeLanguage : undefined}>
            EN
          </Link>
          <Link href="/cz" className={language == "cz" ? styles.activeLanguage : undefined}>
            CZ
          </Link>
        </div>
        <ThemeToggle />
        <MobileMenu language={language} />
      </nav>
    </header>
  );
}
