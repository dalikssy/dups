import { route, requireUser } from "@/lib/adminhub/session";
import { review, activeGuidance, saveGuidance, clearGuidance } from "@/lib/adminhub/strategy";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// The guidance currently applied to new drafts.
export const GET = route(async () => {
  await requireUser();
  return Response.json({ active: await activeGuidance() });
});

// Reviews recent results and proposes changes. Nothing is applied yet.
export const POST = route(async () => {
  await requireUser();
  return Response.json(await review());
});

// Applies a piece of guidance to every draft written from now on.
export const PUT = route(async (request) => {
  const user = await requireUser();
  await saveGuidance((await request.json())?.guidance, user);
  return Response.json({ active: await activeGuidance() });
});

export const DELETE = route(async () => {
  await requireUser();
  await clearGuidance();
  return Response.json({ active: null });
});
