import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { getSetting, setSetting } from "./db";

const API = "https://gmail.googleapis.com/gmail/v1/users/me";
// compose: create drafts. readonly: see whether a draft was sent and whether
// the lead replied. The hub never sends mail itself.
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.readonly",
];

export const SENDER = (process.env.GMAIL_SENDER || "info@dupscaled.com").toLowerCase();

export class GmailError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function redirectUri(origin) {
  return `${origin}/api/adminhub/gmail/callback`;
}

export function consentUrl(origin, state) {
  const params = new URLSearchParams({
    client_id: process.env.AUTH_GOOGLE_ID,
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    login_hint: SENDER,
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

async function token(body) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.AUTH_GOOGLE_ID,
      client_secret: process.env.AUTH_GOOGLE_SECRET,
      ...body,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new GmailError(res.status, json.error_description || json.error || "Google token error");
  return json;
}

// Finishes the consent flow. Only the agency mailbox may be connected.
export async function connect(origin, code) {
  const t = await token({ code, grant_type: "authorization_code", redirect_uri: redirectUri(origin) });
  if (!t.refresh_token) throw new GmailError(400, "Google did not return a refresh token. Try connecting again.");
  const res = await fetch(`${API}/profile`, { headers: { Authorization: `Bearer ${t.access_token}` } });
  const profile = await res.json();
  const email = (profile.emailAddress || "").toLowerCase();
  if (email !== SENDER) throw new GmailError(400, `Connect ${SENDER}, not ${email || "another account"}.`);
  await setSetting("gmail", { email, token: seal(t.refresh_token), connected_at: new Date().toISOString() });
  return email;
}

// The refresh token is a long-lived key to the mailbox, so it is stored
// encrypted (AES-256-GCM, key derived from AUTH_SECRET). A copy of the
// database alone is then not enough to reach the mail.
function key() {
  if (!process.env.AUTH_SECRET) throw new GmailError(500, "AUTH_SECRET is not set");
  return createHash("sha256").update(`hub-gmail:${process.env.AUTH_SECRET}`).digest();
}

function seal(text) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return ["v1", iv, cipher.getAuthTag(), data].map((p) => (typeof p === "string" ? p : p.toString("base64url"))).join(".");
}

function open(sealed) {
  const [, iv, tag, data] = sealed.split(".").map((p, i) => (i ? Buffer.from(p, "base64url") : p));
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

async function refreshToken() {
  const s = await getSetting("gmail");
  if (s?.token) {
    try {
      return open(s.token);
    } catch {
      throw new GmailError(400, "The Gmail connection can no longer be read. Connect it again in Settings.");
    }
  }
  // stored before encryption was added: seal it now
  if (s?.refresh_token) {
    const { refresh_token, ...rest } = s;
    await setSetting("gmail", { ...rest, token: seal(refresh_token) });
    return refresh_token;
  }
  throw new GmailError(400, "Gmail is not connected. An admin can connect it in Settings.");
}

export async function connection() {
  const s = await getSetting("gmail");
  return s ? { email: s.email, connected_at: s.connected_at } : null;
}

let cached; // { value, expires }

async function accessToken() {
  if (cached && cached.expires > Date.now()) return cached.value;
  const t = await token({ refresh_token: await refreshToken(), grant_type: "refresh_token" });
  cached = { value: t.access_token, expires: Date.now() + (t.expires_in - 60) * 1000 };
  return cached.value;
}

async function call(path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  if (res.status === 204) return null;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new GmailError(res.status, json.error?.message || `Gmail error ${res.status}`);
  return json;
}

const b64 = (s) => Buffer.from(s, "utf8").toString("base64");
const header = (s) => (/^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${b64(s)}?=`);

function mime({ to, subject, body, inReplyTo }) {
  const lines = [
    `From: ${SENDER}`,
    `To: ${to}`,
    `Subject: ${header(subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
  ];
  if (inReplyTo) lines.push(`In-Reply-To: ${inReplyTo}`, `References: ${inReplyTo}`);
  const encoded = b64(body.replace(/\r?\n/g, "\r\n")).replace(/(.{76})/g, "$1\r\n");
  return Buffer.from(`${lines.join("\r\n")}\r\n\r\n${encoded}`, "utf8").toString("base64url");
}

// Creates a draft in the mailbox. With threadId + inReplyTo it lands as a
// reply in that conversation (used for follow-ups).
export async function createDraft({ to, subject, body, threadId, inReplyTo }) {
  const message = { raw: mime({ to, subject, body, inReplyTo }) };
  if (threadId) message.threadId = threadId;
  const draft = await call("/drafts", { method: "POST", body: JSON.stringify({ message }) });
  return { draftId: draft.id, threadId: draft.message.threadId };
}

export async function updateDraft(draftId, { to, subject, body, threadId, inReplyTo }) {
  const message = { raw: mime({ to, subject, body, inReplyTo }) };
  if (threadId) message.threadId = threadId;
  await call(`/drafts/${draftId}`, { method: "PUT", body: JSON.stringify({ message }) });
}

const head = (m, name) =>
  m.payload?.headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

function shape(m) {
  const labels = m.labelIds || [];
  const from = head(m, "From");
  return {
    id: m.id,
    date: new Date(Number(m.internalDate)),
    from,
    messageId: head(m, "Message-ID"),
    draft: labels.includes("DRAFT"),
    sent: labels.includes("SENT") && !labels.includes("DRAFT"),
    bounce: /mailer-daemon|postmaster/i.test(from),
  };
}

// Messages of a conversation, oldest first. null if the thread is gone
// (the draft was deleted in Gmail).
export async function thread(threadId) {
  try {
    const t = await call(`/threads/${threadId}?format=metadata&metadataHeaders=From&metadataHeaders=Message-ID`);
    return (t.messages || []).map(shape).sort((a, b) => a.date - b.date);
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
}

// Mail from this address since a date, in any thread: some clients reply
// outside the original conversation.
export async function receivedFrom(email, since) {
  const after = Math.floor(since.getTime() / 1000);
  // -in:sent keeps our own mail out when a lead shares the mailbox's address
  const q = encodeURIComponent(`from:${email} after:${after} -in:sent -in:draft`);
  const list = await call(`/messages?q=${q}&maxResults=1`);
  return Boolean(list.messages?.length);
}
