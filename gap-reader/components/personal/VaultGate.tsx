"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useVault } from "./VaultProvider";
import { unlock } from "@/lib/personal/vaultClient";
import { Button, Card, Field, Input } from "@/components/ui";

/** Renders children only when the vault is unlocked in this browser. */
export function VaultGate({ children }: { children: ReactNode }) {
  const { status, vault, setKey, error } = useVault();
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (status === "loading") return <p className="text-muted" role="status">Opening your vault…</p>;
  if (status === "error") return <Card tone="danger">{error}</Card>;
  if (status === "needs-setup")
    return (
      <Card title="Set up your Personal Gap Reader">
        <p>Before anything is saved, choose a passphrase. It encrypts everything in your browser.</p>
        <p className="mt-3"><Link href="/personal/setup">Start setup</Link></p>
      </Card>
    );
  if (status === "locked")
    return (
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setMsg(null);
          const k = vault ? await unlock(pass, vault) : null;
          setBusy(false);
          setPass("");
          if (!k) setMsg("That passphrase does not open this vault.");
          else await setKey(k);
        }}
      >
        <Card title="Unlock">
          <p className="text-sm text-muted">Your records are encrypted with your passphrase. It never leaves this browser, and no one, including the people who run this app, can recover it for you.</p>
          <div className="mt-4 space-y-3">
            <Field id="pass" label="Passphrase">
              <Input id="pass" type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} required />
            </Field>
            {msg && <p role="alert" className="text-danger">{msg}</p>}
            <Button type="submit" disabled={busy}>{busy ? "Unlocking…" : "Unlock"}</Button>
          </div>
        </Card>
      </form>
    );
  return <>{children}</>;
}
