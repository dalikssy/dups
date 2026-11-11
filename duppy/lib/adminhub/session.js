import { auth } from "@/auth";
import { HttpError } from "./errors";

export { HttpError };

export async function requireUser() {
  const session = await auth();
  const user = session?.user;
  if (!user?.role) throw new HttpError(401, "Unauthorized");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") throw new HttpError(403, "Admins only");
  return user;
}

// Requests that change something must come from the hub's own pages. The
// session cookie is SameSite=Lax already; this is a second lock on the door.
export function sameOrigin(request) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return true;
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

// Wraps a route handler: turns thrown HttpErrors into JSON responses. Anything
// unexpected is logged on the server and answered without internal details.
export function route(handler) {
  return async (request, context) => {
    try {
      if (!sameOrigin(request)) throw new HttpError(403, "Forbidden");
      return await handler(request, context);
    } catch (e) {
      if (e instanceof HttpError) return Response.json({ error: e.message }, { status: e.status });
      console.error(e);
      return Response.json({ error: "Something went wrong. Try again." }, { status: 500 });
    }
  };
}
