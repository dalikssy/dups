import { route, requireUser } from "@/lib/adminhub/session";
import { saveWeek } from "@/lib/adminhub/clients";

// Saves one week of platform numbers and the weekly report text.
export const POST = route(async (request, { params }) => {
  const user = await requireUser();
  const week = await saveWeek(Number(params.id), { ...(await request.json()), by: user.email });
  return Response.json({ ok: true, week });
});
