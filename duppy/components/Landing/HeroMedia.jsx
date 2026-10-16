"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

// "Watch the reel" button + full-screen player with sound.
export function ReelButton({ label, className = "button ghost", iconOnly = false }) {
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
      <button type="button" className={className} onClick={() => setOpen(true)} aria-label={label}>
        <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden="true">
          <path d="M0 0l14 8-14 8z" fill="currentColor" />
        </svg>
        {!iconOnly && label}
      </button>
      {open && src && createPortal(
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
        </div>,
        document.body
      )}
    </>
  );
}
