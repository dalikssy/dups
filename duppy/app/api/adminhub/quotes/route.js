import { route, requireAdmin, sameOrigin, HttpError } from "@/lib/adminhub/session";
import { listQuotes, createQuote, deleteQuote, getPricing, savePricing } from "@/lib/adminhub/quotes";

export const dynamic = "force-dynamic";
export const maxDuration = 300;
const BUDGET = 150 * 1000;

// Pricing is for admins only: the team never sees prices or estimates.
export const GET = route(async () => {
  await requireAdmin();
  return Response.json({ quotes: await listQuotes(), pricing: await getPricing() });
});

// Saves the price list.
export const PUT = route(async (request) => {
  await requireAdmin();
  return Response.json({ pricing: await savePricing(await request.json()) });
});

export const DELETE = route(async (request) => {
  await requireAdmin();
  await deleteQuote(Number(new URL(request.url).searchParams.get("id")));
  return Response.json({ ok: true });
});

// Researches a client and prices the chosen services. Streams
// newline-delimited JSON: {type: "status" | "done" | "error", ...}
export async function POST(request) {
  let user, input;
  try {
    if (!sameOrigin(request)) throw new HttpError(403, "Forbidden");
    user = await requireAdmin();
    input = await request.json();
  } catch (e) {
    const known = e instanceof HttpError;
    return Response.json({ error: known ? e.message : "Bad request" }, { status: known ? e.status : 400 });
  }

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      const emit = (event) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        emit({ type: "done", quote: await createQuote(input, user, { emit, deadline: Date.now() + BUDGET }) });
      } catch (e) {
        if (!(e instanceof HttpError)) console.error(e);
        emit({ type: "error", error: e instanceof HttpError ? e.message : "The estimate failed. Try again." });
      }
      controller.close();
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
