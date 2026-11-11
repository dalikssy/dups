import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

// Contact-data brokers and fan-mail aggregators. Addresses from these bounce
// and hurt the sending domain, so they never count as a source.
const BLOCKED = [
  "rocketreach.co", "contactout.com", "seamless.ai", "zoominfo.com", "apollo.io", "hunter.io",
  "lusha.com", "signalhire.com", "snov.io", "skrapp.io", "anymailfinder.com", "voilanorbert.com",
  "bookingagentinfo.com", "thefanmailaddress.com", "talesfromthecollection.com", "fanmail.biz",
  "celebritiescontact.com", "contactanycelebrity.com", "thehandbook.com", "imdb.com",
  "famousbirthdays.com", "email-format.com", "leadiq.com", "clearbit.com", "datanyze.com",
];

const EMAIL = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
const MAX_REDIRECTS = 4;
const MAX_BYTES = 3_000_000;

function host(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

// http(s) links only; anything else (javascript:, data:, file:) is dropped.
export function httpUrl(value) {
  try {
    const u = new URL(String(value || "").trim());
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString().slice(0, 2000) : null;
  } catch {
    return null;
  }
}

function privateAddress(ip) {
  if (isIP(ip) === 6) {
    const a = ip.toLowerCase();
    if (a.startsWith("::ffff:")) return privateAddress(a.slice(7));
    return a === "::1" || a === "::" || a.startsWith("fc") || a.startsWith("fd") || a.startsWith("fe80");
  }
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

// The source URL comes from the model, so it is treated as untrusted: public
// http(s) hostnames only, and the name must resolve to public addresses, so a
// lookalike domain cannot point the check at our own network.
async function fetchable(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return false;
  if (u.username || u.password) return false;
  if (u.port && !["80", "443"].includes(u.port)) return false;
  const h = u.hostname.toLowerCase();
  if (h === "localhost" || !h.includes(".") || isIP(h.replace(/^\[|\]$/g, ""))) return false;
  if (/\.(local|internal|lan|home|corp|localhost)$/.test(h)) return false;
  try {
    const addresses = await lookup(h, { all: true });
    return addresses.length > 0 && addresses.every((a) => !privateAddress(a.address));
  } catch {
    return false;
  }
}

// Follows redirects by hand so every hop gets the same checks as the first URL.
async function load(url) {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!(await fetchable(current))) return { error: "blocked" };
    const res = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(12000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
      },
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      current = new URL(res.headers.get("location"), current).toString();
      continue;
    }
    if (!res.ok) return { error: `status ${res.status}` };
    if (Number(res.headers.get("content-length")) > MAX_BYTES * 4) return { error: "too large" };
    return { html: (await res.text()).slice(0, MAX_BYTES) };
  }
  return { error: "too many redirects" };
}

function decode(html) {
  return html
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&commat;/g, "@")
    .replace(/&period;/g, ".")
    .replace(/%40/g, "@");
}

// Checks that the address is really printed on the page the model cites.
//   verified: true   the address is on the page
//   verified: false  the page loaded and the address is not there, or the
//                    source is not acceptable at all (rejected: true)
//   verified: null   the page could not be loaded from here; a human decides
export async function verifyEmail(email, sourceUrl) {
  if (!EMAIL.test(email || "") || email.length > 254) {
    return { verified: false, rejected: true, reason: "That is not a valid email address." };
  }
  const h = host(sourceUrl);
  if (!h || !httpUrl(sourceUrl)) {
    return { verified: false, rejected: true, reason: "source_url must be a public http(s) page." };
  }
  if (BLOCKED.some((b) => h === b || h.endsWith(`.${b}`))) {
    return { verified: false, rejected: true, reason: `${h} is a contact-data aggregator, not an official source.` };
  }

  let page;
  try {
    page = await load(sourceUrl);
  } catch {
    return { verified: null, reason: "The source page could not be loaded for our check." };
  }
  if (page.error === "blocked") {
    return { verified: false, rejected: true, reason: "source_url must be a public http(s) page." };
  }
  if (page.error) return { verified: null, reason: `The source page could not be loaded for our check (${page.error}).` };

  if (decode(page.html).toLowerCase().includes(email.toLowerCase())) return { verified: true };
  return { verified: false, reason: "The address does not appear in the HTML of the source page." };
}
