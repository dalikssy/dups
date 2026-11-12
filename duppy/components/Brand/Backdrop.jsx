// Full-screen brand backdrop, after the header artwork in the brand kit:
// oversized ghost marks on black with a green and a cyan growth line.
// Purely decorative, so it is hidden from assistive tech.
export default function Backdrop({ lines = true, quiet = false }) {
  return (
    <div className={`hub-backdrop${quiet ? " quiet" : ""}`} aria-hidden="true">
      <span className="ghost a" />
      <span className="ghost b" />
      {lines && (
        <svg className="lines" viewBox="0 0 1600 900" preserveAspectRatio="none">
          <defs>
            <linearGradient id="bd-green" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#8efc09" stopOpacity="0.22" />
              <stop offset="1" stopColor="#8efc09" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="bd-blue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#00fffc" stopOpacity="0.18" />
              <stop offset="1" stopColor="#00fffc" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 330L120 312L180 262L310 240L372 152L440 188L500 0V330Z" fill="url(#bd-green)" />
          <path className="g" d="M0 330L120 312L180 262L310 240L372 152L440 188L500 0" />
          <path d="M1080 900L1180 872L1340 850L1400 778L1500 824L1600 640V900Z" fill="url(#bd-blue)" />
          <path className="b" d="M1080 900L1180 872L1340 850L1400 778L1500 824L1600 640" />
        </svg>
      )}
    </div>
  );
}
