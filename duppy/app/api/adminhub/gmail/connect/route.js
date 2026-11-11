import { cookies } from "next/headers";
import { route, requireAdmin } from "@/lib/adminhub/session";
import { consentUrl } from "@/lib/adminhub/gmail";

export const dynamic = "force-dynamic";

export const GET = route(async (request) => {
  await requireAdmin();
  const { origin, protocol } = new URL(request.url);
  const state = crypto.randomUUID();
  cookies().set("hub_gmail_state", state, {
    httpOnly: true,
    secure: protocol === "https:",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return Response.redirect(consentUrl(origin, state));
});
