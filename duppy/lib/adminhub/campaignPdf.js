import { PDFDocument, rgb } from "pdf-lib";
import { LOGOS } from "../../components/Brand/logoData.js";
import { BLACK, DIM, Doc, ENERGY, GHOST, H, LINE, M, PAD, SPACE, W, WHITE, block, roundRect } from "./auditPdf";
import { CAMPAIGN_PLATFORMS, ENGAGEMENT, FIELDS, compact, formatField, hours, percent, plainText, summarize } from "../campaignFields";

// Branded campaign report: the same numbers as the portal page, in the
// audit PDF's type and layout system.

const hex = (h) => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
const TRACK = rgb(0.13, 0.13, 0.13);
const ACCENTS = ["#00fffc", "#ff5fa2", "#ffc94d", "#8efc09", "#b48cff", "#ff9f43"];
const INNER = W - 2 * M;

const day = (iso, opts = { day: "numeric", month: "short", year: "numeric" }) =>
  iso ? new Date(`${new Date(iso).toISOString().slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-GB", { ...opts, timeZone: "UTC" }) : "";

// A row of number cards, `cols` per line.
function tiles(doc, items, cols = 3) {
  const gap = 10;
  const w = (INNER - gap * (cols - 1)) / cols;
  for (let i = 0; i < items.length; i += cols) {
    const row = items.slice(i, i + cols).map((item) => ({
      ...item,
      label: block(item.label, { style: "label", size: 6.5, color: hex(item.color), width: w - 2 * PAD }),
      value: block(item.value, { style: "number", size: item.size || 18, width: w - 2 * PAD }),
      sub: item.sub ? block(item.sub, { size: 8, color: DIM, width: w - 2 * PAD }) : null,
    }));
    const height = PAD * 2 + 4 + Math.max(...row.map((t) => t.label.height + SPACE.md + t.value.height + (t.sub ? SPACE.sm + t.sub.height : 0)));
    doc.ensure(height + gap);
    row.forEach((t, j) => {
      const x = M + j * (w + gap);
      doc.path(roundRect(x, doc.y, w, height, 12), { color: GHOST, borderColor: LINE, borderWidth: 0.75 });
      doc.path(roundRect(x + PAD, doc.y + PAD - 6, 22, 3, 1.5), { color: hex(t.color) });
      let y = doc.y + PAD + 4;
      y += doc.draw(t.label, x + PAD, y) + SPACE.md;
      y += doc.draw(t.value, x + PAD, y);
      if (t.sub) doc.draw(t.sub, x + PAD, y + SPACE.sm);
    });
    doc.y += height + gap;
  }
}

// A horizontal bar made of coloured parts, scaled against `max`.
function bar(doc, x, y, width, parts, max, height = 8) {
  doc.path(roundRect(x, y, width, height, height / 2), { color: TRACK });
  let at = x;
  for (const part of parts) {
    const w = max ? (part.value / max) * width : 0;
    if (w < 0.5) continue;
    doc.path(roundRect(at, y, w, height, Math.min(height / 2, w / 2)), { color: hex(part.color) });
    at += w;
  }
}

function cover(doc, campaign, sum) {
  doc.newPage({ plain: true });

  // a rising bar motif in the brand and platform colours, top right
  const bars = [0.34, 0.48, 0.42, 0.62, 0.56, 0.78, 0.7, 1];
  const bw = 26;
  bars.forEach((v, i) => {
    const h = v * 230;
    const x = W - M - (bars.length - i) * (bw + 8) + 8;
    doc.path(roundRect(x, 70 + 230 - h, bw, h, 8), { color: hex(ACCENTS[i % ACCENTS.length]), opacity: 0.35 + 0.55 * (i / (bars.length - 1)) });
  });

  const logo = LOGOS.full;
  doc.path(logo.d, { x: M, y: M, scale: 22 / logo.height, color: WHITE });

  const width = INNER - 20;
  const dates = [campaign.starts, campaign.ends].filter(Boolean).map((d) => day(d)).join(" – ");
  const tag = block("Campaign report_", { style: "label", size: 8.5, color: ENERGY, width });
  const name = block(plainText(campaign.name), { style: "display", size: 32, width });
  const meta = block([campaign.brand, plainText(campaign.client), dates].filter(Boolean).join("  ·  "), { style: "label", size: 7.5, color: hex("#00fffc"), width });
  const summary = campaign.summary ? block(plainText(campaign.summary), { size: 10.5, color: DIM, width: width - 60 }) : null;

  let y = H * 0.44;
  y += doc.draw(tag, M, y) + SPACE.md;
  y += doc.draw(name, M, y) + SPACE.md;
  y += doc.draw(meta, M, y) + SPACE.lg;
  if (summary) y += doc.draw(summary, M, y) + SPACE.lg;

  doc.y = y + SPACE.sm;
  tiles(doc, [
    { label: "Views", value: compact(sum.totals.views), color: "#00fffc", size: 22 },
    { label: "Engagement rate", value: percent(sum.engagement, 2), color: "#ffc94d", size: 22 },
    { label: "New followers", value: sum.totals.new_followers ? compact(sum.totals.new_followers) : "–", color: "#8efc09", size: 22 },
  ]);

  doc.path(`M${M} ${H - M - SPACE.md}H${W - M}`, { borderColor: LINE, borderWidth: 0.75 });
  doc.draw(block(`Updated ${day(campaign.updated_at || new Date(), { day: "numeric", month: "long", year: "numeric" })}`, { style: "label", size: 7, color: DIM, width: 300 }), M, H - M);
  doc.draw(block("www.dupscaled.com", { style: "label", size: 7, color: DIM, width: INNER, align: "right" }), M, H - M);
}

export async function campaignPdf(campaign) {
  const videos = campaign.videos || [];
  const sum = summarize(videos);
  const used = CAMPAIGN_PLATFORMS.filter((p) => videos.some((v) => v.stats?.[p.key]));
  const title = plainText(campaign.name);

  const pdf = await PDFDocument.create();
  pdf.setTitle(`${title} · Campaign report · DUPSCALED`);
  pdf.setAuthor("DUPSCALED");
  const doc = new Doc(pdf, `Campaign report  ·  ${title}`);

  cover(doc, campaign, sum);
  doc.newPage();

  doc.section("Results", "The campaign in numbers", 120);
  tiles(doc, [
    { label: "Views", value: compact(sum.totals.views), color: "#00fffc", sub: `${videos.length} videos` },
    { label: "Likes", value: compact(sum.totals.likes), color: "#ff5fa2" },
    { label: "Engagement rate", value: percent(sum.engagement, 2), color: "#ffc94d", sub: `${compact(sum.interactions)} interactions` },
    { label: "New followers", value: sum.totals.new_followers ? compact(sum.totals.new_followers) : "–", color: "#8efc09" },
    { label: "Watch time", value: sum.totals.play_time_h ? hours(sum.totals.play_time_h) : "–", color: "#b48cff" },
    { label: "Shares + saves", value: compact(sum.totals.shares + sum.totals.saves), color: "#ff9f43" },
  ]);

  if (campaign.highlights?.length) {
    doc.section("Channel", "Highlights", 90);
    tiles(
      doc,
      campaign.highlights.map((h, i) => ({ label: plainText(h.label), value: plainText(h.value), color: ACCENTS[(i + 3) % ACCENTS.length], size: 15 })),
      2,
    );
  }

  if (used.length > 1) {
    doc.section("Reach", "Views by platform", 60);
    bar(doc, M, doc.y, INNER, used.map((p) => ({ value: sum.byPlatform[p.key]?.views || 0, color: p.color })), sum.totals.views, 14);
    doc.y += 14 + SPACE.md;
    const colW = INNER / used.length;
    used.forEach((p, i) => {
      const views = sum.byPlatform[p.key]?.views || 0;
      const share = sum.totals.views ? Math.round((views / sum.totals.views) * 100) : 0;
      doc.path(roundRect(M + i * colW, doc.y + 1, 7, 7, 3.5), { color: hex(p.color) });
      doc.draw(block(`${p.label}  ${compact(views)}  ·  ${share}%`, { style: "strong", size: 9.5, width: colW - 16 }), M + i * colW + 14, doc.y);
    });
    doc.y += 20;
  }

  doc.section("Videos", "Views per video", 80);
  const most = Math.max(...videos.map((v) => used.reduce((t, p) => t + (v.stats?.[p.key]?.views || 0), 0)), 1);
  for (const v of videos) {
    const total = used.reduce((t, p) => t + (v.stats?.[p.key]?.views || 0), 0);
    const name = block(plainText(v.title), { style: "strong", size: 9.5, width: INNER - 90 });
    const value = block(compact(total), { style: "number", size: 9.5, width: INNER, align: "right" });
    doc.ensure(name.height + SPACE.sm + 8 + SPACE.md);
    doc.draw(name, M, doc.y);
    doc.draw(value, M, doc.y);
    doc.y += name.height + SPACE.sm;
    bar(doc, M, doc.y, INNER, used.map((p) => ({ value: v.stats?.[p.key]?.views || 0, color: p.color })), most);
    doc.y += 8 + SPACE.md;
  }

  doc.section("Engagement", "How people interacted", 80);
  const topEngagement = Math.max(...ENGAGEMENT.map((e) => sum.totals[e.key]), 1);
  for (const e of ENGAGEMENT) {
    const label = block(e.label, { style: "strong", size: 9.5, width: 110 });
    doc.ensure(label.height + SPACE.md);
    doc.draw(label, M, doc.y);
    doc.draw(block(compact(sum.totals[e.key]), { style: "number", size: 9.5, width: INNER, align: "right" }), M, doc.y);
    bar(doc, M + 110, doc.y - 0.5, INNER - 110 - 70, [{ value: sum.totals[e.key], color: e.color }], topEngagement);
    doc.y += label.height + SPACE.md;
  }

  doc.section("Breakdown", "Every video, platform by platform", 160);
  const inner = INNER - 2 * PAD;
  for (const v of videos) {
    const mine = used.filter((p) => v.stats?.[p.key]);
    const labelW = inner * 0.44;
    const colW = (inner - labelW) / Math.max(mine.length, 1);
    const edge = (k) => labelW + (k + 1) * colW;
    const fields = FIELDS.filter((f) => mine.some((p) => v.stats[p.key][f.key] != null));
    const meta = [v.posted_on && `Posted ${day(v.posted_on)}`, v.length_s && `${Math.round(v.length_s)}s`].filter(Boolean).join("  ·  ");
    const rows = [
      { gap: SPACE.xs, blocks: [block(plainText(v.title), { style: "strong", size: 11.5, width: inner })] },
      ...(meta ? [{ gap: SPACE.md, blocks: [block(meta, { style: "label", size: 6.5, color: DIM, width: inner })] }] : []),
      {
        gap: SPACE.sm,
        blocks: mine.map((p, k) => block(p.label, { style: "label", size: 7, color: hex(p.color), width: edge(k), align: "right" })),
      },
      ...fields.map((f, i) => ({
        gap: i < fields.length - 1 ? 8 : 0,
        blocks: [
          block(f.label, { size: 8.5, color: DIM, width: labelW }),
          ...mine.map((p, k) => block(formatField(f, v.stats[p.key][f.key]), { style: "strong", size: 8.5, width: edge(k), align: "right" })),
        ],
      })),
    ];
    doc.card(rows);
  }

  // closing line
  const closing = block("Thank you for creating with DUPSCALED.", { style: "heading", size: 13, color: BLACK, width: INNER - 2 * PAD });
  const height = PAD * 2 + closing.height;
  doc.y += SPACE.md;
  doc.ensure(height);
  doc.path(roundRect(M, doc.y, INNER, height, 14), { color: ENERGY });
  doc.draw(closing, M + PAD, doc.y + PAD);

  return pdf.save();
}

export function pdfResponse(campaign, bytes) {
  const file = `${plainText(campaign.name).replace(/[^\w]+/g, "-").replace(/^-+|-+$/g, "") || "campaign"}-DUPSCALED-report.pdf`;
  return new Response(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${file}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
