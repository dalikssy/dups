import { cookies } from "next/headers";
import { requireAdmin, HttpError } from "@/lib/adminhub/session";
import { connect, GmailError } from "@/lib/adminhub/gmail";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const url = new URL(request.url);
  const back = (message) =>
    Response.redirect(`${url.origin}/adminhub/settings?gmail=${encodeURIComponent(message)}`);
  try {
    await requireAdmin();
    const state = cookies().get("hub_gmail_state")?.value;
    cookies().delete("hub_gmail_state");
    if (!state || state !== url.searchParams.get("state")) return back("The request expired. Try again.");
    const code = url.searchParams.get("code");
    if (!code) return back("Google did not grant access.");
    await connect(url.origin, code);
    return back("connected");
  } catch (e) {
    // only our own messages reach the page; anything else is logged
    if (e instanceof GmailError || e instanceof HttpError) return back(e.message);
    console.error(e);
    return back("Could not connect Gmail.");
  }
}
