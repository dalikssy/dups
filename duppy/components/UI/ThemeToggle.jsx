"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme || "light");
  }, []);

  const flip = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("dups-theme", next);
    } catch (e) {}
    setTheme(next);
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={flip}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light" : "Dark"}
    >
      {theme === "dark" ? (
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <g fill="currentColor">
            <rect x="7" y="7" width="4" height="4" />
            <rect x="8" y="0" width="2" height="4" />
            <rect x="8" y="14" width="2" height="4" />
            <rect x="0" y="8" width="4" height="2" />
            <rect x="14" y="8" width="4" height="2" />
            <rect x="2" y="2" width="2" height="2" />
            <rect x="14" y="2" width="2" height="2" />
            <rect x="2" y="14" width="2" height="2" />
            <rect x="14" y="14" width="2" height="2" />
          </g>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="currentColor" d="M8 1h4v2h2v2h2v4h-2V7h-2V5h-2v2H8v4h2v2h4v-2h2v4h-2v2h-2v2H6v-2H4v-2H2v-2H0V7h2V5h2V3h2V1h2z" />
        </svg>
      )}
    </button>
  );
}
