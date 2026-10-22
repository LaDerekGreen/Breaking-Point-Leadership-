"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Page, Card, Button, Field, Input, Select, Textarea } from "@/components/ui";
import { useVault } from "@/components/personal/VaultProvider";
import { createVault, saveRecord } from "@/lib/personal/vaultClient";
import { passphraseProblem } from "@/lib/personal/crypto";
import { PROVIDERS, type ProviderId } from "@/lib/ai/adapter";
import { PERSONAL_GAP_READER_PROMPT } from "@/lib/ai/prompts";
import { IDS, type AISettings, type Profile } from "@/lib/personal/types";

export function Setup() {
  const { status, setKey } = useVault();
  const router = useRouter();
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [provider, setProvider] = useState<ProviderId>("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [values, setValues] = useState("");
  const [ack, setAck] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (status === "loading") return <Page title="Setup"><p role="status">Loading…</p></Page>;
  if (status !== "needs-setup")
    return (
      <Page title="Setup">
        <Card>Your vault is already set up. Change your AI key or passphrase in <a href="/personal/settings">Settings</a>.</Card>
      </Page>
    );

  return (
    <Page title="Set up your Personal Gap Reader" intro="Three things: a passphrase only you know, your own AI key, and the values you say you lead by.">
      <Card tone="warn" title="A personal device and a personal account">
        <p>Use a personal device and a personal account, not an employer&apos;s. Work laptops, work browsers and work email can be monitored, and this is your private reflection. Describe people by role, never by name, and leave out confidential details.</p>
      </Card>
      <form
        className="space-y-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setErr(null);
          const p = passphraseProblem(pass);
          if (p) return setErr(p);
          if (pass !== pass2) return setErr("The two passphrases do not match.");
          if (!ack) return setErr("Please confirm you understand the passphrase cannot be recovered.");
          setBusy(true);
          try {
            const key = await createVault(pass);
            if (apiKey.trim()) await saveRecord(key, "settings", IDS.settings, { provider, apiKey: apiKey.trim() } satisfies AISettings);
            await saveRecord(key, "profile", IDS.profile, { values: values.trim(), breakingPoint: "", createdAt: new Date().toISOString() } satisfies Profile);
            await setKey(key);
            router.push("/personal/reader");
          } catch (e2) {
            setErr((e2 as Error).message);
            setBusy(false);
          }
        }}
      >
        <Card title="1. Your passphrase">
          <div className="space-y-4">
            <p className="text-sm text-muted">Everything is encrypted in this browser with a key made from your passphrase. The passphrase never leaves this browser. If you forget it, no one can recover your records, including the people who run this app.</p>
            <Field id="pass" label="Passphrase" hint="At least twelve characters. A short sentence works well.">
              <Input id="pass" type="password" autoComplete="new-password" value={pass} onChange={(e) => setPass(e.target.value)} required />
            </Field>
            <Field id="pass2" label="The same passphrase again">
              <Input id="pass2" type="password" autoComplete="new-password" value={pass2} onChange={(e) => setPass2(e.target.value)} required />
            </Field>
            <label className="flex items-start gap-2"><input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-1" /> I understand my passphrase cannot be recovered.</label>
          </div>
        </Card>
        <Card title="2. Your own AI key">
          <div className="space-y-4">
            <p className="text-sm text-muted">Your conversations go from this browser straight to your AI provider, with your key. This app never sees them and carries no AI cost. The key is stored encrypted under your passphrase. You can add it later.</p>
            <Field id="provider" label="Provider">
              <Select id="provider" value={provider} onChange={(e) => setProvider(e.target.value as ProviderId)}>
                {Object.entries(PROVIDERS).map(([id, p]) => <option key={id} value={id}>{p.label}</option>)}
              </Select>
            </Field>
            <Field id="apiKey" label="API key" hint={PROVIDERS[provider].keyHint}>
              <Input id="apiKey" type="password" autoComplete="off" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
            </Field>
          </div>
        </Card>
        <Card title="3. The values you say you lead by">
          <Field id="values" label="In your own words" hint="Your Gap Reader will compare these with the real decisions you describe.">
            <Textarea id="values" value={values} onChange={(e) => setValues(e.target.value)} rows={4} />
          </Field>
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer">The instruction your Gap Reader starts from</summary>
            <p className="mt-2 whitespace-pre-line">{PERSONAL_GAP_READER_PROMPT}</p>
          </details>
        </Card>
        {err && <p role="alert" className="text-danger">{err}</p>}
        <Button type="submit" disabled={busy}>{busy ? "Encrypting…" : "Create my vault"}</Button>
      </form>
    </Page>
  );
}
