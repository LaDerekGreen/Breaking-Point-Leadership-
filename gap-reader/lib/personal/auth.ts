import "server-only";
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { personalDb } from "./db";
import { magicLinkProvider, productCookies } from "@/lib/shared/email";

/**
 * Auth.js instance for the Personal Gap Reader. Its own base path, its own
 * cookies, its own user and session tables in the personal schema. No SSO:
 * a personal account should never be an employer's account.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  basePath: "/api/auth/personal",
  adapter: PrismaAdapter(personalDb as never),
  session: { strategy: "database", maxAge: 30 * 24 * 60 * 60 },
  providers: [magicLinkProvider("personal")],
  cookies: productCookies("gr-personal"),
  pages: { signIn: "/personal/signin", verifyRequest: "/personal/signin?sent=1", error: "/personal/signin" },
  trustHost: true,
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
