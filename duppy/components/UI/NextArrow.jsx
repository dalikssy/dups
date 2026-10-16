import styles from "./NextArrow.module.css";

export default function NextArrow({ onClickFunction, flip, label = "Next" }) {
  return (
    <button
      type="button"
      className={`${styles.next} ${flip ? styles.flip : ""}`}
      onClick={onClickFunction}
      aria-label={label}
    >
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
        <path d="M4 11h13M11 4l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
      </svg>
    </button>
  );
}
