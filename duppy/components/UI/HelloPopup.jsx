"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const COPY = {
  en: {
    title: "This site is alive.",
    body: "Hover anything. Click the empty space. Some things might glitch. That's a feature.",
    cta: "Let me play",
  },
  cz: {
    title: "Tenhle web žije.",
    body: "Najeď na cokoli. Klikni do prázdna. Něco se možná rozbije. To je feature.",
    cta: "Jdu si hrát",
  },
};

// One-time playful hint so visitors start poking at the effects.
export default function HelloPopup({ language = "en" }) {
  const [open, setOpen] = useState(false);
  const t = COPY[language] || COPY.en;

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("dups-hello-s") === "1";
    } catch (e) {}
    // Only on computers: the tip is about hovering with a mouse.
    const desktop = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (seen || !desktop) return;
    const id = setTimeout(() => setOpen(true), 1400);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const close = () => {
    setOpen(false);
    try {
      sessionStorage.setItem("dups-hello-s", "1");
    } catch (e) {}
  };

  if (!open) return null;
  return createPortal(
    <div className="hello" role="dialog" aria-modal="true" aria-labelledby="hello-t" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="hello-card" data-tilt>
        <div className="hello-px" aria-hidden="true">
          {Array.from({ length: 25 }, (_, i) => (
            <i key={i} style={{ animationDelay: `${(i % 5) * 90 + Math.floor(i / 5) * 60}ms` }} />
          ))}
        </div>
        <p className="lab">psst</p>
        <h2 id="hello-t" className="glitch" data-text={t.title}>
          {t.title}
        </h2>
        <p className="hello-body">{t.body}</p>
        <button type="button" className="button" onClick={close} autoFocus>
          {t.cta}
        </button>
      </div>
    </div>,
    document.body
  );
}
