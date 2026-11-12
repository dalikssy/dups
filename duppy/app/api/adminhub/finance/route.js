import { route, requireAdmin } from "@/lib/adminhub/session";
import { overview, setRetainer, setPaid } from "@/lib/adminhub/finance";

export const dynamic = "force-dynamic";

// Finance is for admins only.
export const GET = route(async (request) => {
  await requireAdmin();
  return Response.json(await overview(new URL(request.url).searchParams.get("month")));
});

// {clientId, retainer, currency} sets what a client pays per month.
export const POST = route(async (request) => {
  await requireAdmin();
  const input = await request.json();
  await setRetainer(Number(input?.clientId), input);
  return Response.json({ ok: true });
});

// {clientId, month, paid} marks one month as paid or not.
export const PUT = route(async (request) => {
  await requireAdmin();
  const input = await request.json();
  await setPaid(Number(input?.clientId), input?.month, input?.paid);
  return Response.json({ ok: true });
});
