"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

const ITEMS = {
  en: [["#services", "Services"], ["#references", "Clients"], ["#casestudy", "Case study"], ["#form", "Contact"], ["/onboarding", "Client portal"]],
  cz: [["#services", "Služby"], ["#references", "Klienti"], ["#casestudy", "Case study"], ["#form", "Kontakt"], ["/onboarding", "Klientský portál"]],
};

export default function MobileMenu({ language }) {
  const [open, setOpen] = useState(false);
  const [root, setRoot] = useState(null);
  useEffect(() => setRoot(document.body), []);
  useEffect(() => {
    document.documentElement.classList.toggle("menu-open", open);
    return () => document.documentElement.classList.remove("menu-open");
  }, [open]);

  return (
    <>
      <button type="button" className="mm-btn" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        <i />
        <i />
        <i />
      </button>
      {root &&
        createPortal(
          <nav className={`mm ${open ? "mm-open" : ""}`} aria-hidden={!open}>
            <button type="button" className="mm-close" aria-label="Close menu" onClick={() => setOpen(false)}>
              ×
            </button>
            {(ITEMS[language] || ITEMS.en).map(([href, label], i) => (
              <a key={href} href={href} onClick={() => setOpen(false)} style={{ transitionDelay: open ? `${80 + i * 45}ms` : "0ms" }}>
                <span>0{i + 1}</span>
                {label}
              </a>
            ))}
            <div className="mm-lang">
              <Link href="/en" onClick={() => setOpen(false)} aria-current={language === "en" ? "page" : undefined}>EN</Link>
              <Link href="/cz" onClick={() => setOpen(false)} aria-current={language === "cz" ? "page" : undefined}>CZ</Link>
            </div>
          </nav>,
          root
        )}
    </>
  );
}
