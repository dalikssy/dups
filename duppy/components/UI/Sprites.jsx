import {
  LOGOS,
  LOGO_SPRITE,
  LOGO_SPRITE_W,
  PX_SPRITE,
  PX_TILE,
  ROSTER,
} from "@/lib/media";

// One logo mark from the sprite, scaled to a given height.
// Rendered as a CSS mask so it can take any brand color.
export function Logo({ name, height = 40, color = "#fff", className, style }) {
  const L = LOGOS[name];
  const s = height / L.h;
  const size = `${LOGO_SPRITE_W * s}px auto`;
  const pos = `0 ${-L.y * s}px`;
  const img = `url(${LOGO_SPRITE})`;
  return (
    <span
      role="img"
      aria-label={L.label}
      className={className}
      style={{
        display: "inline-block",
        flex: "none",
        width: Math.round(L.w * s),
        height,
        backgroundColor: color,
        WebkitMaskImage: img,
        maskImage: img,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: size,
        maskSize: size,
        WebkitMaskPosition: pos,
        maskPosition: pos,
        ...style,
      }}
    />
  );
}

// One pixel-art portrait by roster index.
export function Pixel({ index, size = 120, className, style }) {
  const s = size / PX_TILE;
  return (
    <span
      role="img"
      aria-label={ROSTER[index]}
      className={className}
      style={{
        display: "block",
        flex: "none",
        width: size,
        height: size,
        imageRendering: "pixelated",
        backgroundImage: `url(${PX_SPRITE})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${PX_TILE * ROSTER.length * s}px ${size}px`,
        backgroundPosition: `${-index * size}px 0`,
        ...style,
      }}
    />
  );
}
