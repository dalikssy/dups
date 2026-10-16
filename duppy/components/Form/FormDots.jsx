import styles from "./Form.module.css";

// Row of pixels next to the submit button: idle, ripple on hover,
// marching while sending, solid when sent.
export default function Dots({ sent, disable }) {
  const state = sent ? styles.pxSent : disable ? styles.pxSending : "";
  return (
    <div className={`${styles.px} ${state}`} aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => (
        <i key={i} style={{ animationDelay: `${i * 70}ms` }} />
      ))}
    </div>
  );
}
