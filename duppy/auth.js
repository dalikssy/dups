import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { sql } from "@/lib/adminhub/db";

const ROLE_TTL = 5 * 60 * 1000;

function envAdmins() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

// Who may use the hub: ADMIN_EMAILS (bootstrap admins, always allowed) plus the
// whitelist the admin manages in Settings. Returns null for everyone else.
export async function roleFor(email) {
  const e = (email || "").toLowerCase();
  if (!e) return null;
  if (envAdmins().includes(e)) return "admin";
  try {
    const rows = await sql`select role from hub_users where email = ${e}`;
    return rows[0]?.role ?? null;
  } catch {
    return null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  trustHost: true,
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  pages: { signIn: "/adminhub/login", error: "/adminhub/login" },
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.email || profile.email_verified === false) return false;
      return Boolean(await roleFor(profile.email));
    },
    // The role is re-read every few minutes so removing someone from the
    // whitelist locks them out without waiting for their session to expire.
    async jwt({ token }) {
      if (!token.email) return token;
      if (!token.roleAt || Date.now() - token.roleAt > ROLE_TTL) {
        token.role = await roleFor(token.email);
        token.roleAt = Date.now();
      }
      return token;
    },
    session({ session, token }) {
      session.user.role = token.role || null;
      return session;
    },
  },
});
