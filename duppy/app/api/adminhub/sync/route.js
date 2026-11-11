import { route, requireUser } from "@/lib/adminhub/session";
import { sync } from "@/lib/adminhub/outreach";

export const maxDuration = 300;

export const POST = route(async () => {
  await requireUser();
  return Response.json({ report: await sync() });
});
