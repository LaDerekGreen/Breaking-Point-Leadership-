import "server-only";
import type { EmailConfig } from "next-auth/providers/email";

/**
 * A magic link email provider shared in shape (not in data) by the two auth
 * instances. With no SMTP_URL configured, the link is written to the server
 * log, which is for development only.
 */
export function magicLinkProvider(product: "org" | "personal"): EmailConfig {
  const productName = product === "org" ? "Organizational Gap Reader" : "Personal Gap Reader";
  return {
    id: "email",
    type: "email",
    name: "Email",
    from: process.env.EMAIL_FROM ?? "Gap Reader <no-reply@example.org>",
    maxAge: 15 * 60,
    async sendVerificationRequest({ identifier, url, provider }) {
      const smtp = process.env.SMTP_URL;
      const text = `Sign in to the ${productName}:\n\n${url}\n\nThis link works once and expires in fifteen minutes. If you did not ask for it, you can ignore this email.`;
      if (!smtp) {
        if (process.env.NODE_ENV === "production") throw new Error("SMTP_URL is not configured.");
        console.log(`\n[${productName}] magic link for ${identifier}:\n${url}\n`);
        return;
      }
      const nodemailer = await import("nodemailer");
      const transport = nodemailer.createTransport(smtp);
      await transport.sendMail({ to: identifier, from: provider.from, subject: `Sign in to the ${productName}`, text });
    },
    options: {},
  };
}

/** Distinct cookie names per product, so one product's session never reaches the other. */
export function productCookies(prefix: string) {
  const secure = (process.env.APP_URL ?? "").startsWith("https://");
  const p = secure ? `__Secure-${prefix}` : prefix;
  const options = { httpOnly: true, sameSite: "lax" as const, path: "/", secure };
  return {
    sessionToken: { name: `${p}.session-token`, options },
    callbackUrl: { name: `${p}.callback-url`, options },
    csrfToken: { name: `${secure ? "__Host-" : ""}${prefix}.csrf-token`, options },
    pkceCodeVerifier: { name: `${p}.pkce.code_verifier`, options: { ...options, maxAge: 900 } },
    state: { name: `${p}.state`, options: { ...options, maxAge: 900 } },
    nonce: { name: `${p}.nonce`, options },
    webauthnChallenge: { name: `${p}.challenge`, options: { ...options, maxAge: 900 } },
  };
}
