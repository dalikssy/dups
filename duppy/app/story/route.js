import { kv } from "@vercel/kv";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  if (!key) return Response.json(null);
  try {
    const value = await kv.get(key);
    return Response.json(value ?? null);
  } catch {
    return Response.json(null)
  }
}

export async function POST(request) {
  try {
    const { key, value } = await request.json();
    if (!key) return Response.json({ ok: false });
    await kv.set(key, value);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false });
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  if (!key) return Response.json({ ok: false });
  try {
    await kv.del(key);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false });
  }
}
