import { route, requireAdmin } from "@/lib/adminhub/session";
import { addEntry, setEntryPaid, deleteEntry } from "@/lib/adminhub/finance";

export const dynamic = "force-dynamic";

// Income entered by hand: any person or company and an amount. Admins only.
// {name, amount, currency, date, note, paid}
export const POST = route(async (request) => {
  const user = await requireAdmin();
  await addEntry(await request.json(), user);
  return Response.json({ ok: true });
});

// {id, paid} marks an entry as paid or not.
export const PUT = route(async (request) => {
  await requireAdmin();
  const input = await request.json();
  await setEntryPaid(Number(input?.id), input?.paid);
  return Response.json({ ok: true });
});

export const DELETE = route(async (request) => {
  await requireAdmin();
  await deleteEntry(Number(new URL(request.url).searchParams.get("id")));
  return Response.json({ ok: true });
});
