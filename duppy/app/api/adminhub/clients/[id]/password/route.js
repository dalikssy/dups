import { route, requireAdmin } from "@/lib/adminhub/session";
import { resetPassword } from "@/lib/adminhub/clients";

// Issues a new portal password and signs the client out everywhere.
export const POST = route(async (request, { params }) => {
  await requireAdmin();
  return Response.json(await resetPassword(Number(params.id)));
});
