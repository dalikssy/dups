import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { sql } from "@/lib/adminhub/db";

// Sign-in for clients: email + password, kept apart from the team's Google
// login so a client session can never open the admin hub.

const scryptAsync = promisify(scrypt);
const COOKIE = "portal_session";
const DAYS = 14;
const MAX_FAILS = 5;
const LOCK_MINUTES = 15;

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, 64);
  return `scrypt$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

async function passwordMatches(password, stored) {
  const [, salt, hash] = (stored || "").split("$");
  // Without a stored hash a dummy one is checked, so a wrong email takes as
  // long as a wrong password and the form does not reveal who has an account.
  const expected = hash ? Buffer.from(hash, "base64url") : Buffer.alloc(64);
  const key = await scryptAsync(password, salt ? Buffer.from(salt, "base64url") : Buffer.alloc(16), 64);
  return Boolean(hash) && key.length === expected.length && timingSafeEqual(key, expected);
}

// Fourteen characters without look-alikes, easy to read out or paste.
export function newPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  return Array.from(randomBytes(14), (b) => alphabet[b % alphabet.length]).join("");
}

function key() {
  if (!process.env.AUTH_SECRET) throw new Error("AUTH_SECRET is not set");
  return createHash("sha256").update(`portal-session:${process.env.AUTH_SECRET}`).digest();
}

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${createHmac("sha256", key()).update(body).digest("base64url")}`;
}

function unsign(token) {
  const [body, mac] = (token || "").split(".");
  if (!body || !mac) return null;
  const expected = createHmac("sha256", key()).update(body).digest();
  const given = Buffer.from(mac, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

// Returns {ok, error}. Five wrong passwords lock the account for a while.
export async function signIn(email, password) {
  const address = String(email || "").trim().toLowerCase();
  const pass = String(password || "");
  const fail = { ok: false, error: "That email and password do not match." };
  if (!address || !pass || pass.length > 200) return fail;

  const rows = await sql`select * from hub_clients where lower(email) = ${address}`;
  const client = rows[0];
  if (client?.locked_until && new Date(client.locked_until) > new Date()) {
    await passwordMatches(pass, null);
    return { ok: false, error: "Too many attempts. Try again in a few minutes." };
  }

  const valid = await passwordMatches(pass, client?.password_hash);
  if (!client || !valid || client.status === "ended") {
    if (client) {
      const fails = client.failed_logins + 1;
      const lock = fails >= MAX_FAILS ? new Date(Date.now() + LOCK_MINUTES * 60000) : null;
      await sql`update hub_clients set failed_logins = ${lock ? 0 : fails}, locked_until = ${lock} where id = ${client.id}`;
    }
    return fail;
  }

  await sql`update hub_clients set failed_logins = 0, locked_until = null, last_login_at = now() where id = ${client.id}`;
  cookies().set(COOKIE, sign({ cid: client.id, v: client.session_version, exp: Date.now() + DAYS * 86400000 }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DAYS * 86400,
  });
  return { ok: true };
}

export function signOut() {
  cookies().delete(COOKIE);
}

// The signed-in client, or null. Resetting a password bumps session_version,
// which signs out every existing session for that client.
export async function currentClient() {
  const payload = unsign(cookies().get(COOKIE)?.value);
  if (!payload) return null;
  const rows = await sql`
    select id, name, email, status, session_version from hub_clients where id = ${payload.cid}`;
  const client = rows[0];
  if (!client || client.session_version !== payload.v || client.status === "ended") return null;
  return client;
}
