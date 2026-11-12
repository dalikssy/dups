import { requireUser, sameOrigin, HttpError } from "@/lib/adminhub/session";
import { createAudit, auditUrl } from "@/lib/adminhub/outreach";

export const maxDuration = 300;
const BUDGET = 270 * 1000;

// Researches one lead and builds its audit. Streams newline-delimited JSON:
// {type: "status" | "done" | "error", ...}
export async function POST(request) {
  let user, leadId;
  try {
    if (!sameOrigin(request)) throw new HttpError(403, "Forbidden");
    user = await requireUser();
    leadId = Number((await request.json())?.leadId);
    if (!Number.isInteger(leadId)) throw new HttpError(400, "Pick a lead.");
  } catch (e) {
    const known = e instanceof HttpError;
    return Response.json({ error: known ? e.message : "Bad request" }, { status: known ? e.status : 400 });
  }

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      const emit = (event) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        const audit = await createAudit(leadId, user, { emit, deadline: Date.now() + BUDGET });
        emit({ type: "done", audit, url: auditUrl(audit.slug) });
      } catch (e) {
        console.error(e);
        emit({ type: "error", error: e instanceof HttpError ? e.message : "The audit failed. Try again." });
      }
      controller.close();
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
