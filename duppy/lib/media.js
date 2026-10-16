// Media rendered from the DUPSCALED promo (v14). Hosted on the Higgsfield CDN.
const CDN = "https://d2ol7oe51mr4n9.cloudfront.net/user_3HPxrGsPuGeZcLUulgUMU2YDdgp";

export const REEL_WIDE = `${CDN}/595df082-cdda-48ca-81ea-1b72da52c519.mp4`; // 1920x1080
export const REEL_TALL = `${CDN}/3dfa6c79-f2e8-41a5-a14a-067a33bdffd7.mp4`; // 1080x1920

// White logo marks stacked vertically in one 700px-wide sprite.
export const LOGO_SPRITE = `${CDN}/61ae86ca-3df9-45f6-9d2c-15d462c08781.png`;
export const LOGO_SPRITE_W = 700;
export const LOGOS = {
  gamdom: { y: 0, w: 700, h: 164, label: "Gamdom" },
  nba: { y: 174, w: 124, h: 300, label: "NBA" },
  ewc: { y: 484, w: 700, h: 132, label: "Esports World Cup" },
  livesport: { y: 626, w: 700, h: 87, label: "Livesport" },
  mag: { y: 723, w: 700, h: 264, label: "The MAG" },
  forbes: { y: 997, w: 700, h: 176, label: "Forbes" },
  symbol: { y: 1183, w: 700, h: 293, label: "DUPSCALED" },
  wordmark: { y: 1486, w: 700, h: 63, label: "DUPSCALED" },
};

// Keyin as a standalone pixel portrait (504px).
export const PX_KEYIN = `${CDN}/983d7b19-ef45-4fe8-b40c-6c5648928ebf.png`;

// Pixel-art portraits, 252px tiles laid out horizontally.
export const PX_SPRITE = `${CDN}/02f0d8f3-11f2-403a-b094-d9b8b8346765.png`;
export const PX_TILE = 252;
export const ROSTER = [
  "BENJYFISHY",
  "FAZE JARVIS",
  "MRSAVAGE",
  "MONGRAAL",
  "BRUCEDROPEMOFF",
  "STABLERONALDO",
  "KING KENNY",
  "MILAD MIRG",
  "SCREAM",
  "KOVY",
  "MOHAMED LIGHT",
];
