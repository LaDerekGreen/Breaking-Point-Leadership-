import Link from "next/link";
import { Page, Card, Button, Field, Input } from "@/components/ui";
import { signIn } from "@/lib/personal/auth";

export const metadata = { title: "Sign in" };

async function emailSignIn(formData: FormData) {
  "use server";
  await signIn("email", { email: String(formData.get("email") ?? "").trim().toLowerCase(), redirectTo: "/personal" });
}

export default async function SignIn({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const sp = await searchParams;
  return (
    <main id="main">
      <Page title="Personal Gap Reader" intro="A private reflection tool for one leader: the Source Inquiry, the workbook exercises and your own decision log.">
        <Card tone="warn" title="Use your own device and your own account">
          <p>Use a personal device and a personal email address, not your employer&apos;s. An employer&apos;s laptop, browser or email can be monitored, and this is your private reflection.</p>
        </Card>
        {sp.sent && <Card tone="accent">Check your personal email for a sign in link. It works once and expires in fifteen minutes.</Card>}
        {sp.error && <Card tone="danger">That link did not work. Ask for a new one.</Card>}
        <form action={emailSignIn} className="space-y-4">
          <Field id="email" label="Personal email">
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </Field>
          <Button type="submit">Email me a sign in link</Button>
        </form>
        <p className="text-sm text-muted">This account is separate from any organization&apos;s Gap Reader. <Link href="/">Back to Gap Reader</Link></p>
      </Page>
    </main>
  );
}
