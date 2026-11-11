import { kv } from "@vercel/kv";
import { auth } from "@/auth";
import { clientCode, forClient, clientUpdate, validTeamWrite, tooBig } from "@/lib/portalAccess";

export const dynamic = "force-dynamic";

const deny = (status) => Response.json(null, { status });

async function isTeam() {
  try {
    const session = await auth();
    return Boolean(session?.user?.role);
  } catch {
    return false;
  }
}

// Slows down guessing of client access codes: a handful of wrong codes per
// address every ten minutes, then the address is locked out for the rest of it.
const WINDOW = 600;
const MAX_MISSES = 8;

function bucket(request) {
  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  return `rl:portal:${ip}:${Math.floor(Date.now() / 1000 / WINDOW)}`;
}

async function lockedOut(request) {
  try {
    return Number(await kv.get(bucket(request))) >= MAX_MISSES;
  } catch {
    return false;
  }
}

async function recordMiss(request) {
  try {
    const key = bucket(request);
    if ((await kv.incr(key)) === 1) await kv.expire(key, WINDOW);
  } catch {}
}

export async function GET(request) {
  const key = new URL(request.url).searchParams.get("key");
  const team = await isTeam();

  // The portal asks this first to decide between the team view and the code prompt.
  if (key === "session") return Response.json({ team });

  if (key === "clients:index") {
    if (!team) return deny(403);
    try {
      return Response.json((await kv.get(key)) ?? null);
    } catch {
      return Response.json(null);
    }
  }

  if (!clientCode(key)) return deny(team ? 400 : 403);
  if (!team && (await lockedOut(request))) return deny(429);
  try {
    const record = await kv.get(key);
    if (!record && !team) await recordMiss(request);
    return Response.json(team ? (record ?? null) : forClient(record));
  } catch {
    return Response.json(null);
  }
}

export async function POST(request) {
  let key, value;
  try {
    ({ key, value } = await request.json());
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  if (tooBig(value)) return Response.json({ ok: false }, { status: 413 });

  try {
    if (await isTeam()) {
      if (!validTeamWrite(key, value)) return Response.json({ ok: false }, { status: 400 });
      await kv.set(key, value);
      return Response.json({ ok: true });
    }

    // A client saving their own onboarding. The code is the credential, so the
    // record has to exist already; everything except onboarding is kept as is.
    if (!clientCode(key)) return Response.json({ ok: false }, { status: 403 });
    if (await lockedOut(request)) return Response.json({ ok: false }, { status: 429 });
    const next = clientUpdate(await kv.get(key), value);
    if (!next) {
      await recordMiss(request);
      return Response.json({ ok: false }, { status: 403 });
    }
    await kv.set(key, next);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false });
  }
}

export async function DELETE(request) {
  const key = new URL(request.url).searchParams.get("key");
  if (!(await isTeam())) return Response.json({ ok: false }, { status: 403 });
  if (!clientCode(key)) return Response.json({ ok: false }, { status: 400 });
  try {
    await kv.del(key);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false });
  }
}
