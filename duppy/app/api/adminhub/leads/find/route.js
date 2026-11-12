import { requireUser, sameOrigin, HttpError } from "@/lib/adminhub/session";
import { sql } from "@/lib/adminhub/db";
import { findLeads } from "@/lib/adminhub/claude";
import { saveFoundLead } from "@/lib/adminhub/outreach";

export const maxDuration = 300;
const BUDGET = 270 * 1000; // stop cleanly before the platform kills the function

// Streams newline-delimited JSON events while the research runs:
// {type: "status" | "lead" | "skipped" | "done" | "error", ...}
export async function POST(request) {
  let user, input;
  try {
    if (!sameOrigin(request)) throw new HttpError(403, "Forbidden");
    user = await requireUser();
    input = await request.json();
    if (typeof input?.segment !== "string" || !input.segment.trim()) {
      throw new HttpError(400, "Describe the segment to search.");
    }
  } catch (e) {
    const known = e instanceof HttpError;
    return Response.json({ error: known ? e.message : "Bad request" }, { status: known ? e.status : 400 });
  }

  const text = (value, max) => (typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null);
  const segment = text(input.segment, 1000);
  const market = text(input.market, 200);
  const count = Math.min(Math.max(Number(input.count) || 5, 1), 10);

  // The form's conditions, turned into plain sentences for the model.
  const PLATFORMS = ["YouTube", "Twitch", "Kick", "TikTok", "Instagram", "Podcast"];
  const platforms = Array.isArray(input.platforms) ? PLATFORMS.filter((p) => input.platforms.includes(p)) : [];
  const from = text(input.audienceMin, 20);
  const to = text(input.audienceMax, 20);
  const criteria = [
    platforms.length ? `Main platform is one of: ${platforms.join(", ")}` : null,
    from || to ? `Audience on their main platform is ${from ? `at least ${from}` : ""}${from && to ? " and " : ""}${to ? `at most ${to}` : ""} followers or subscribers` : null,
    text(input.mustHave, 500) ? `Must have: ${text(input.mustHave, 500)}` : null,
    text(input.leaveOut, 500) ? `Leave out: ${text(input.leaveOut, 500)}` : null,
  ].filter(Boolean);
  const encoder = new TextEncoder();

  const body = new ReadableStream({
    async start(controller) {
      const emit = (event) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        const known = await sql`select name, email from hub_leads`;
        const result = await findLeads(
          {
            segment,
            market,
            count,
            criteria,
            notes: text(input.notes, 1000),
            exclude: known.map((l) => `${l.name} <${l.email}>`),
            deadline: Date.now() + BUDGET,
          },
          {
            emit,
            save: async (candidate) => {
              const outcome = await saveFoundLead(candidate, { segment, market, user });
              if (outcome.saved) emit({ type: "lead", lead: outcome.lead });
              else emit({ type: "skipped", name: candidate.name, reason: outcome.message });
              return outcome;
            },
          },
        );
        emit({ type: "done", ...result });
      } catch (e) {
        console.error(e);
        emit({
          type: "error",
          error: e instanceof HttpError ? e.message : "The search failed. Try again, or rephrase the segment.",
        });
      }
      controller.close();
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
