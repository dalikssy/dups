import { LOGOS } from "./logoData";

// The DUPSCALED marks from the brand kit, drawn inline so they take the
// surrounding text colour. variant: full (mark + wordmark), mark (the two
// shapes), type (wordmark), dots (round symbol), braille (dot strip).
export default function Logo({ variant = "full", height = 24, title = "DUPSCALED", className, style }) {
  const logo = LOGOS[variant];
  return (
    <svg
      className={className}
      style={style}
      viewBox={`0 0 ${logo.width} ${logo.height}`}
      height={height}
      width={(height * logo.width) / logo.height}
      fill="currentColor"
      role={title ? "img" : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
    >
      <path fillRule="evenodd" d={logo.d} />
    </svg>
  );
}
