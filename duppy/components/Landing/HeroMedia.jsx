"use client";
import { useEffect, useRef, useState } from "react";
import { REEL_TALL, REEL_WIDE } from "@/lib/media";
import styles from "./Landing.module.css";

function useReelSrc() {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    const mq = window.matchMedia("(max-aspect-ratio: 4/5)");
    const pick = () => setSrc(mq.matches ? REEL_TALL : REEL_WIDE);
    pick();
    mq.addEventListener("change", pick);
    return () => mq.removeEventListener("change", pick);
  }, []);
  return src;
}

// Muted promo loop behind the hero.
export function HeroVideo() {
  const src = useReelSrc();
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  if (!src || reduce) return null;
  return (
    <video
      key={src}
      className={styles.bgVideo}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
    />
  );
}

// "Watch the reel" button + full-screen player with sound.
export function ReelButton({ label }) {
  const [open, setOpen] = useState(false);
  const src = useReelSrc();
  const vid = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button type="button" className="button ghost" onClick={() => setOpen(true)}>
        <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden="true">
          <path d="M0 0l14 8-14 8z" fill="currentColor" />
        </svg>
        {label}
      </button>
      {open && src && (
        <div
          className={styles.modal}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <button className={styles.close} onClick={() => setOpen(false)} aria-label="Close">
            ×
          </button>
          <video ref={vid} className={styles.modalVideo} src={src} controls autoPlay playsInline />
        </div>
      )}
    </>
  );
}
