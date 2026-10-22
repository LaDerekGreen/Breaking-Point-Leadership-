import { Page, Card, Button, Field, Input } from "@/components/ui";
import { signIn, oidcEnabled } from "@/lib/org/auth";

export const metadata = { title: "Sign in" };

async function emailSignIn(formData: FormData) {
  "use server";
  await signIn("email", { email: String(formData.get("email") ?? "").trim().toLowerCase(), redirectTo: "/org" });
}

async function ssoSignIn() {
  "use server";
  await signIn("oidc", { redirectTo: "/org" });
}

export default async function SignIn({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const sp = await searchParams;
  return (
    <Page title="Sign in" intro="Use your work email. We will send you a link that signs you in.">
      {sp.sent && <Card tone="accent">Check your email for a sign in link. It works once and expires in fifteen minutes.</Card>}
      {sp.error && <Card tone="danger">That link did not work. Ask for a new one.</Card>}
      <form action={emailSignIn} className="space-y-4">
        <Field id="email" label="Work email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Button type="submit">Email me a sign in link</Button>
      </form>
      {oidcEnabled && (
        <form action={ssoSignIn}>
          <Button type="submit" variant="secondary">Sign in with single sign on</Button>
        </form>
      )}
    </Page>
  );
}
