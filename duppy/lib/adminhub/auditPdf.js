import fs from "node:fs";
import path from "node:path";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { LOGOS } from "../../components/Brand/logoData.js";

// Branded audit PDF. All type is set in the site's own fonts (Unbounded for
// display, Inter for text) and drawn as outlines, so any weight is available
// and the file looks identical everywhere.
//
// Layout works on a simple rule: every text block is measured from the top of
// its capitals to its last baseline, and every gap is one of the SPACE steps.
// That keeps padding inside cards even on all four sides.

const W = 595.28;
const H = 841.89;
const M = 48; // page margin
const PAD = 18; // inside cards
// sm is the gap between two text rows; it has to clear the upper row's descenders
const SPACE = { xs: 6, sm: 13, md: 18, lg: 30, xl: 40 };

const BLACK = rgb(0, 0, 0);
const GHOST = rgb(0.094, 0.094, 0.094);
const LINE = rgb(0.2, 0.2, 0.2);
const WHITE = rgb(0.969, 0.969, 0.969);
const DIM = rgb(0.66, 0.66, 0.66);
const ENERGY = rgb(0.557, 0.988, 0.035);
const BLUE = rgb(0, 1, 0.988);

const DIR = path.join(process.cwd(), "lib", "adminhub", "fonts");
const files = {};
const faces = {};

function face(name, weight) {
  const key = `${name}:${weight}`;
  if (!faces[key]) {
    files[name] ||= fontkit.create(fs.readFileSync(path.join(DIR, `${name}.ttf`)));
    faces[key] = files[name].getVariation({ wght: weight });
  }
  return faces[key];
}

// leading is the distance between baselines, as a multiple of the size
const STYLES = {
  display: { font: "Unbounded", weight: 800, tracking: -0.015, leading: 1.12 },
  heading: { font: "Unbounded", weight: 700, tracking: -0.005, leading: 1.25 },
  number: { font: "Unbounded", weight: 700, tracking: 0, leading: 1.2 },
  label: { font: "Inter", weight: 600, tracking: 0.14, leading: 1.4, upper: true },
  body: { font: "Inter", weight: 400, tracking: 0, leading: 1.5 },
  strong: { font: "Inter", weight: 650, tracking: 0, leading: 1.35 },
};

function metrics(style) {
  const f = face(style.font, style.weight);
  return { f, cap: (f.capHeight || f.ascent * 0.72) / f.unitsPerEm };
}

function shape(text, style, size) {
  const { f } = metrics(style);
  const scale = size / f.unitsPerEm;
  const run = f.layout(style.upper ? text.toUpperCase() : text);
  const extra = style.tracking * size;
  let x = 0;
  let d = "";
  run.glyphs.forEach((glyph, i) => {
    // font outlines are y-up; flip them into the y-down space drawSvgPath expects
    d += glyph.path.scale(scale, -scale).translate(x, 0).toSVG();
    x += run.positions[i].xAdvance * scale + extra;
  });
  return { d, width: Math.max(x - extra, 0) };
}

function wrap(text, style, size, maxWidth) {
  const lines = [];
  for (const paragraph of String(text ?? "").split(/\n+/)) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (line && shape(next, style, size).width > maxWidth) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    if (line) lines.push(line);
  }
  return lines;
}

// A measured piece of text: lines plus its exact height (cap top to last baseline).
function block(text, { style = "body", size = 10, color = WHITE, width, align = "left" }) {
  const s = STYLES[style];
  const lines = wrap(text, s, size, width);
  const cap = metrics(s).cap * size;
  const step = s.leading * size;
  return { lines, s, size, color, width, align, cap, step, height: lines.length ? cap + (lines.length - 1) * step : 0 };
}

function roundRect(x, y, w, h, r) {
  return `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
}

class Doc {
  constructor(pdf, running) {
    this.pdf = pdf;
    this.running = running;
    this.pages = 0;
  }

  // y is measured from the top of the page, like on screen
  path(d, { x = 0, y = 0, scale = 1, color, borderColor, borderWidth, opacity }) {
    this.page.drawSvgPath(d, { x, y: H - y, scale, color, borderColor, borderWidth, opacity, borderOpacity: opacity });
  }

  // Draws a measured block with its cap top at (x, y); returns its height.
  draw(b, x, y) {
    b.lines.forEach((line, i) => {
      const { d, width } = shape(line, b.s, b.size);
      this.path(d, { x: x + (b.align === "right" ? b.width - width : 0), y: y + b.cap + i * b.step, color: b.color });
    });
    return b.height;
  }

  newPage({ plain = false } = {}) {
    this.page = this.pdf.addPage([W, H]);
    this.pages++;
    this.page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: BLACK });
    this.y = M;
    if (plain) return;
    const logo = LOGOS.full;
    const logoH = 15;
    this.path(logo.d, { x: M, y: M, scale: logoH / logo.height, color: WHITE });
    const head = block(this.running, { style: "label", size: 6.5, color: DIM, width: W - 2 * M, align: "right" });
    this.draw(head, M, M + (logoH - head.height) / 2);
    this.path(`M${M} ${M + logoH + SPACE.md}H${W - M}`, { borderColor: LINE, borderWidth: 0.75 });
    const footY = H - M + 6;
    this.draw(block("www.dupscaled.com", { style: "label", size: 6.5, color: DIM, width: 200 }), M, footY);
    this.draw(block(String(this.pages).padStart(2, "0"), { style: "label", size: 6.5, color: DIM, width: W - 2 * M, align: "right" }), M, footY);
    this.y = M + logoH + SPACE.md + SPACE.lg;
  }

  get bottom() {
    return H - M - SPACE.md;
  }

  ensure(height) {
    if (this.y + height > this.bottom) this.newPage();
  }

  // Section label + title. Stays with at least `keep` points of what follows.
  section(label, title, keep = 70) {
    const l = block(`${label}_`, { style: "label", size: 7.5, color: ENERGY, width: W - 2 * M });
    const t = block(title, { style: "heading", size: 17, width: W - 2 * M });
    const height = l.height + SPACE.sm + t.height + SPACE.md;
    if (this.y > M + 80) this.y += SPACE.lg; // not at the top of a page
    this.ensure(height + keep);
    this.y += this.draw(l, M, this.y) + SPACE.sm;
    this.y += this.draw(t, M, this.y) + SPACE.md;
  }

  // A card holding stacked rows. Each row is {blocks: [...], gap} where the
  // blocks share one line (left/right) and gap is the space after the row.
  card(rows, { indent = 0, lead } = {}) {
    const height = PAD * 2 + rows.reduce((sum, r, i) => sum + Math.max(...r.blocks.map((b) => b.height)) + (i < rows.length - 1 ? r.gap : 0), 0);
    this.ensure(height + SPACE.sm);
    const top = this.y;
    this.path(roundRect(M, top, W - 2 * M, height, 12), { color: GHOST, borderColor: LINE, borderWidth: 0.75 });
    if (lead) this.draw(lead, M + PAD, top + PAD);
    let y = top + PAD;
    for (const row of rows) {
      for (const b of row.blocks) this.draw(b, M + PAD + indent, y);
      y += Math.max(...row.blocks.map((b) => b.height)) + row.gap;
    }
    this.y = top + height + SPACE.sm;
  }
}

async function cover(doc, pdf, lead, audit, dateLabel) {
  doc.newPage({ plain: true });

  // artwork across the top of the page; its lower half is already black
  try {
    const art = await pdf.embedJpg(fs.readFileSync(path.join(process.cwd(), "public", "brand", "bg-growth.jpg")));
    const height = (W / art.width) * art.height;
    doc.page.drawImage(art, { x: 0, y: H - height * 0.9, width: W, height });
  } catch {
    // the cover still works without the artwork
  }

  const logo = LOGOS.full;
  doc.path(logo.d, { x: M, y: M, scale: 22 / logo.height, color: WHITE });

  const width = W - 2 * M - 30;
  const tag = block("Short-form audit_", { style: "label", size: 8.5, color: ENERGY, width });
  const name = block(lead.name, { style: "display", size: 34, width });
  const headline = block(audit.headline, { style: "heading", size: 14.5, color: ENERGY, width: width - 30 });
  const summary = block(audit.summary, { size: 11, width: width - 50 });
  const total = tag.height + SPACE.md + name.height + SPACE.lg + headline.height + SPACE.md + summary.height;

  // the text block sits in the lower part of the page, clear of the artwork
  let y = Math.min(H * 0.52, H - M - SPACE.xl - total);
  y += doc.draw(tag, M, y) + SPACE.md;
  y += doc.draw(name, M, y) + SPACE.lg;
  y += doc.draw(headline, M, y) + SPACE.md;
  doc.draw(summary, M, y);

  doc.path(`M${M} ${H - M - SPACE.md}H${W - M}`, { borderColor: LINE, borderWidth: 0.75 });
  doc.draw(block(dateLabel, { style: "label", size: 7, color: DIM, width: 300 }), M, H - M);
  doc.draw(block("www.dupscaled.com", { style: "label", size: 7, color: DIM, width: W - 2 * M, align: "right" }), M, H - M);
}

const L = {
  en: {
    channels: ["Channels", "Where you publish today"],
    working: ["Strengths", "What is already working"],
    gaps: ["Reach", "Where views are being left on the table"],
    clips: ["First cuts", "Clips we would cut first"],
    next: ["Next", "How we would start"],
    source: "Source",
    cta: "Two free sample clips, cut from your own content.",
    ctaSub: "No commitment. Reply to the email and we will send them over.",
    running: "Short-form audit",
    date: "Prepared",
  },
  cs: {
    channels: ["Kanály", "Kde dnes publikujete"],
    working: ["Silné stránky", "Co už funguje"],
    gaps: ["Dosah", "Kde zůstávají views nevyužité"],
    clips: ["První střihy", "Klipy, které bychom udělali jako první"],
    next: ["Další kroky", "Jak bychom začali"],
    source: "Zdroj",
    cta: "Dva ukázkové klipy zdarma, z vašeho vlastního obsahu.",
    ctaSub: "Bez závazku. Stačí odpovědět na e-mail a pošleme je.",
    running: "Short-form audit",
    date: "Připraveno",
  },
};

export async function auditPdf(lead, audit, createdAt) {
  const cs = lead.language === "cs";
  const t = L[cs ? "cs" : "en"];
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${lead.name} · Short-form audit · DUPSCALED`);
  pdf.setAuthor("DUPSCALED");
  const doc = new Doc(pdf, `${t.running}  ·  ${lead.name}`);
  const date = new Date(createdAt || Date.now()).toLocaleDateString(cs ? "cs-CZ" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const inner = W - 2 * M - 2 * PAD;

  await cover(doc, pdf, lead, audit, `${t.date} ${date}`);
  doc.newPage();

  if (audit.channels?.length) {
    doc.section(...t.channels);
    for (const c of audit.channels) {
      doc.card([
        {
          gap: SPACE.sm,
          blocks: [
            block(c.platform, { style: "label", size: 7, color: BLUE, width: inner }),
            block(c.audience || "", { style: "label", size: 7, color: DIM, width: inner, align: "right" }),
          ],
        },
        { gap: SPACE.sm, blocks: [block(c.handle, { style: "strong", size: 11.5, width: inner })] },
        { gap: 0, blocks: [block(c.note, { size: 9.5, color: DIM, width: inner })] },
      ]);
    }
  }

  if (audit.working?.length) {
    doc.section(...t.working, 30);
    for (const point of audit.working) {
      const b = block(point, { size: 10.5, width: W - 2 * M - 22 });
      doc.ensure(b.height + SPACE.sm);
      doc.path(roundRect(M, doc.y + (b.cap - 6) / 2, 6, 6, 3), { color: ENERGY });
      doc.y += doc.draw(b, M + 22, doc.y) + SPACE.md;
    }
  }

  if (audit.gaps?.length) {
    doc.section(...t.gaps);
    audit.gaps.forEach((gap, i) => {
      const title = block(gap.title, { style: "strong", size: 11.5, width: inner - 40 });
      // the number is set so its capitals line up with the title's
      const number = block(String(i + 1).padStart(2, "0"), { style: "number", size: 11.5, color: ENERGY, width: 36 });
      doc.card(
        [
          { gap: SPACE.sm, blocks: [title] },
          { gap: 0, blocks: [block(gap.detail, { size: 9.5, color: DIM, width: inner - 40 })] },
        ],
        { indent: 40, lead: number },
      );
    });
  }

  if (audit.clip_ideas?.length) {
    doc.section(...t.clips, 110);
    for (const clip of audit.clip_ideas) {
      doc.card([
        { gap: SPACE.sm, blocks: [block(clip.title, { style: "strong", size: 11.5, width: inner })] },
        { gap: SPACE.md, blocks: [block(`“${clip.hook}”`, { style: "heading", size: 11, color: ENERGY, width: inner })] },
        { gap: SPACE.sm, blocks: [block(clip.why, { size: 9.5, width: inner })] },
        { gap: 0, blocks: [block(`${t.source}: ${clip.source}`, { size: 8.5, color: DIM, width: inner })] },
      ]);
    }
  }

  if (audit.next_steps?.length) {
    doc.section(...t.next, 30);
    audit.next_steps.forEach((step, i) => {
      const b = block(step, { size: 10.5, width: W - 2 * M - 34 });
      doc.ensure(b.height + SPACE.sm);
      doc.draw(block(String(i + 1).padStart(2, "0"), { style: "number", size: 10.5, color: BLUE, width: 30 }), M, doc.y);
      doc.y += doc.draw(b, M + 34, doc.y) + SPACE.md;
    });
  }

  // closing offer
  const cta = block(t.cta, { style: "heading", size: 15, color: BLACK, width: inner });
  const sub = block(t.ctaSub, { size: 9.5, color: BLACK, width: inner });
  const height = PAD * 2 + 4 + cta.height + SPACE.md + sub.height;
  doc.y += SPACE.md;
  doc.ensure(height);
  doc.path(roundRect(M, doc.y, W - 2 * M, height, 14), { color: ENERGY });
  doc.draw(cta, M + PAD, doc.y + PAD + 2);
  doc.draw(sub, M + PAD, doc.y + PAD + 2 + cta.height + SPACE.md);

  return pdf.save();
}
