import { sql } from "./db";
import { HttpError } from "./errors";
import { CURRENCIES } from "./quotes";

// Finance is an overview only: who pays what each month and who has paid.
// Invoices are issued elsewhere.

const isMonth = (value) => typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
export const thisMonth = () => new Date().toISOString().slice(0, 7);

function shift(month, by) {
  const d = new Date(`${month}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + by);
  return d.toISOString().slice(0, 7);
}

// Totals per currency. Amounts in different currencies are never added up.
function byCurrency(rows, amountOf) {
  const totals = {};
  for (const row of rows) totals[row.currency] = (totals[row.currency] || 0) + amountOf(row);
  return totals;
}

export async function overview(month) {
  const current = isMonth(month) ? month : thisMonth();
  const first = `${current}-01`;

  const clients = await sql`
    select c.id, c.name, c.status, c.retainer::float8 as retainer, c.retainer_currency as currency,
           p.amount::float8 as billed, p.currency as billed_currency, coalesce(p.paid, false) as paid, p.paid_at
    from hub_clients c
    left join hub_payments p on p.client_id = c.id and p.month = ${first}
    where c.status <> 'ended' or p.id is not null
    order by c.name`;

  // A month's row uses what was recorded for that month; if nothing was
  // recorded yet, the client's current retainer is what is expected.
  const rows = clients
    .map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      retainer: c.retainer,
      amount: c.billed ?? c.retainer ?? 0,
      currency: c.billed_currency || c.currency,
      paid: c.paid,
      paid_at: c.paid_at,
    }))
    .filter((c) => c.amount > 0 || c.retainer === null);

  const billable = rows.filter((r) => r.amount > 0);
  const from = `${shift(current, -5)}-01`;
  const history = await sql`
    select to_char(month, 'YYYY-MM') as month, currency, sum(amount)::float8 as received
    from hub_payments where paid and month >= ${from} and month <= ${first}
    group by 1, 2 order by 1`;

  return {
    month: current,
    months: Array.from({ length: 6 }, (_, i) => shift(current, i - 5)),
    clients: rows,
    expected: byCurrency(billable, (r) => r.amount),
    received: byCurrency(billable.filter((r) => r.paid), (r) => r.amount),
    outstanding: byCurrency(billable.filter((r) => !r.paid), (r) => r.amount),
    history,
  };
}

export async function setRetainer(clientId, input) {
  const amount = input?.retainer === "" || input?.retainer === null ? null : Number(input?.retainer);
  if (amount !== null && (!Number.isFinite(amount) || amount < 0 || amount > 1e7)) throw new HttpError(400, "Enter a valid amount.");
  const currency = CURRENCIES.includes(input?.currency) ? input.currency : "EUR";
  const rows = await sql`
    update hub_clients set retainer = ${amount}, retainer_currency = ${currency} where id = ${clientId} returning id`;
  if (!rows[0]) throw new HttpError(404, "Client not found.");
}

// Marks a month as paid or unpaid. The amount is frozen from the retainer at
// the moment the month is first recorded, so later price changes do not
// rewrite past months.
export async function setPaid(clientId, month, paid) {
  if (!isMonth(month)) throw new HttpError(400, "Pick a month.");
  const client = (await sql`select retainer::float8 as retainer, retainer_currency from hub_clients where id = ${clientId}`)[0];
  if (!client) throw new HttpError(404, "Client not found.");
  if (!client.retainer) throw new HttpError(400, "Set this client's retainer first.");
  await sql`
    insert into hub_payments (client_id, month, amount, currency, paid, paid_at)
    values (${clientId}, ${`${month}-01`}, ${client.retainer}, ${client.retainer_currency}, ${Boolean(paid)}, ${paid ? new Date() : null})
    on conflict (client_id, month) do update set paid = excluded.paid, paid_at = excluded.paid_at`;
}
