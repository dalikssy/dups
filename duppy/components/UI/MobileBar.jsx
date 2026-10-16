"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ReelButton } from "../Landing/HeroMedia";

// Phones only: a thumb-reach bar with the two actions that matter.
export default function MobileBar({ language }) {
  const [root, setRoot] = useState(null);
  useEffect(() => setRoot(document.body), []);
  if (!root) return null;
  return createPortal(
    <div className="mbar">
      <a className="button" href="https://calendly.com/dupscaled/free-meeting" target="_blank" rel="noreferrer">
        {language === "cz" ? "Sjednat schůzku" : "Book a free call"}
      </a>
      <ReelButton label={language === "cz" ? "Pustit showreel" : "Watch the reel"} className="mbar-reel" iconOnly />
    </div>,
    root
  );
}
