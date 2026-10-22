import "server-only";
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { orgDb } from "./db";
import { magicLinkProvider, productCookies } from "@/lib/shared/email";
import type { Provider } from "next-auth/providers";
import type { Role } from "./roles";

declare module "next-auth" {
  interface Session {
    user: { id: string; email: string; name?: string | null; roles?: Role[] };
  }
}

const providers: Provider[] = [
  magicLinkProvider("org"),
];
if (process.env.OIDC_ISSUER && process.env.OIDC_CLIENT_ID) {
  providers.push({
    id: "oidc",
    name: process.env.OIDC_NAME || "Single sign-on",
    type: "oidc",
    issuer: process.env.OIDC_ISSUER,
    clientId: process.env.OIDC_CLIENT_ID,
    clientSecret: process.env.OIDC_CLIENT_SECRET,
    allowDangerousEmailAccountLinking: true,
  });
}

export const oidcEnabled = providers.length > 1;

function bootstrapEmail(): string | null {
  return process.env.BOOTSTRAP_PROGRAM_LEAD_EMAIL?.trim().toLowerCase() || null;
}

/**
 * Auth.js instance for the Organizational Gap Reader. Its own base path, its
 * own cookies, its own session table in the org schema.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  basePath: "/api/auth/org",
  adapter: PrismaAdapter(orgDb as never),
  session: { strategy: "database", maxAge: 8 * 60 * 60 },
  providers,
  cookies: productCookies("gr-org"),
  pages: { signIn: "/org/signin", verifyRequest: "/org/signin?sent=1", error: "/org/signin" },
  trustHost: true,
  events: {
    async createUser({ user }) {
      if (user.email && user.email.toLowerCase() === bootstrapEmail()) {
        await orgDb.user.update({ where: { id: user.id }, data: { roles: ["program_lead"] } });
      }
    },
  },
  callbacks: {
    /** Only people in the admin directory, or the bootstrap program lead, can sign in. */
    async signIn({ user }) {
      const email = user.email?.trim().toLowerCase();
      if (!email) return false;
      if (email === bootstrapEmail()) return true;
      return !!(await orgDb.user.findUnique({ where: { email } }));
    },
    session({ session, user }) {
      const u = user as unknown as { id: string; roles?: Role[] };
      session.user.id = u.id;
      session.user.roles = u.roles ?? [];
      return session;
    },
  },
});
