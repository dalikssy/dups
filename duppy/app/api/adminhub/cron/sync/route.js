import { timingSafeEqual } from "node:crypto";
import { sync } from "@/lib/adminhub/outreach";
import { connection } from "@/lib/adminhub/gmail";

export const maxDuration = 300;

// Daily Vercel cron (vercel.json). Vercel sends CRON_SECRET as a bearer token.
export async function GET(request) {
  const secret = process.env.CRON_SECRET || "";
  const given = Buffer.from(request.headers.get("authorization") || "");
  const expected = Buffer.from(`Bearer ${secret}`);
  // a short or missing secret disables the endpoint rather than leaving it guessable
  if (secret.length < 24 || given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await connection())) return Response.json({ skipped: "Gmail is not connected" });
  return Response.json({ report: await sync() });
}
