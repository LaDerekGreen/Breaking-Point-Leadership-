"use client";

import { useEffect, useState } from "react";
import { Page, Card, Button, Field, Input, Select } from "@/components/ui";
import { VaultGate } from "@/components/personal/VaultGate";
import { useKey, useVault } from "@/components/personal/VaultProvider";
import { useRecord } from "@/components/personal/hooks";
import { PROVIDERS, type ProviderId } from "@/lib/ai/adapter";
import { rekey } from "@/lib/personal/vaultClient";
import { passphraseProblem } from "@/lib/personal/crypto";
import { IDS, type AISettings } from "@/lib/personal/types";

function Inner() {
  const key = useKey();
  const { setKey } = useVault();
  const { value, save } = useRecord<AISettings>("settings", IDS.settings);
  const [provider, setProvider] = useState<ProviderId>("anthropic");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [pmsg, setPmsg] = useState<string | null>(null);
  useEffect(() => {
    if (value) { setProvider(value.provider); setModel(value.model ?? ""); }
  }, [value]);

  return (
    <div className="space-y-6">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const k = apiKey.trim() || value?.apiKey || "";
          if (!k) return setMsg("Enter your API key.");
          await save({ provider, apiKey: k, model: model.trim() || undefined });
          setApiKey("");
          setMsg("Saved, encrypted under your passphrase.");
        }}
      >
        <Card title="Your own AI key">
          <p className="text-sm text-muted">Calls go from this browser straight to your provider. This app never sees your conversations and carries no AI cost. Use a personal key, not one your employer issued.</p>
          <div className="mt-4 space-y-4">
            <Field id="provider" label="Provider">
              <Select id="provider" value={provider} onChange={(e) => setProvider(e.target.value as ProviderId)}>
                {Object.entries(PROVIDERS).map(([id, p]) => <option key={id} value={id}>{p.label}</option>)}
              </Select>
            </Field>
            <Field id="model" label="Model" hint={`Leave blank for ${PROVIDERS[provider].defaultModel}.`}><Input id="model" value={model} onChange={(e) => setModel(e.target.value)} /></Field>
            <Field id="apiKey" label="API key" hint={value?.apiKey ? "A key is saved. Leave blank to keep it." : PROVIDERS[provider].keyHint}>
              <Input id="apiKey" type="password" autoComplete="off" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
            </Field>
            {msg && <p role="status">{msg}</p>}
            <Button type="submit">Save</Button>
          </div>
        </Card>
      </form>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const prob = passphraseProblem(p1);
          if (prob) return setPmsg(prob);
          if (p1 !== p2) return setPmsg("The two passphrases do not match.");
          setPmsg("Re-encrypting everything…");
          try {
            const k = await rekey(key, p1);
            await setKey(k);
            setP1(""); setP2("");
            setPmsg("Done. Everything is now encrypted under your new passphrase.");
          } catch (e2) {
            setPmsg((e2 as Error).message);
          }
        }}
      >
        <Card title="Change passphrase">
          <div className="space-y-4">
            <Field id="p1" label="New passphrase"><Input id="p1" type="password" autoComplete="new-password" value={p1} onChange={(e) => setP1(e.target.value)} /></Field>
            <Field id="p2" label="The same passphrase again"><Input id="p2" type="password" autoComplete="new-password" value={p2} onChange={(e) => setP2(e.target.value)} /></Field>
            {pmsg && <p role="status">{pmsg}</p>}
            <Button type="submit" variant="secondary">Change passphrase</Button>
          </div>
        </Card>
      </form>
    </div>
  );
}

export function SettingsPage() {
  return (
    <Page title="Settings">
      <VaultGate><Inner /></VaultGate>
    </Page>
  );
}
