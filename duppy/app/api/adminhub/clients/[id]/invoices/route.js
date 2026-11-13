import { route, requireAdmin } from "@/lib/adminhub/session";
import { listInvoices, saveInvoice, setInvoicePaid, deleteInvoice } from "@/lib/adminhub/finance";

export const dynamic = "force-dynamic";

// A client's invoices, entered by hand. Money is for admins only.
export const GET = route(async (request, { params }) => {
  await requireAdmin();
  return Response.json({ invoices: await listInvoices(Number(params.id)) });
});

// {number, issued, due, currency, items, link} adds an invoice; with id it rewrites one.
export const POST = route(async (request, { params }) => {
  const user = await requireAdmin();
  await saveInvoice(Number(params.id), await request.json(), user);
  return Response.json({ ok: true });
});

// {id, paid} marks an invoice as paid or not.
export const PUT = route(async (request, { params }) => {
  await requireAdmin();
  const input = await request.json();
  await setInvoicePaid(Number(params.id), Number(input?.id), input?.paid);
  return Response.json({ ok: true });
});

export const DELETE = route(async (request, { params }) => {
  await requireAdmin();
  await deleteInvoice(Number(params.id), Number(new URL(request.url).searchParams.get("id")));
  return Response.json({ ok: true });
});
