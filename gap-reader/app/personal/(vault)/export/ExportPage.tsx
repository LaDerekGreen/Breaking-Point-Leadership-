"use client";

import { useState } from "react";
import { Page, Card, Button, Field, Input } from "@/components/ui";
import { VaultGate } from "@/components/personal/VaultGate";
import { useKey, useVault } from "@/components/personal/VaultProvider";
import { deleteEverything, exportAll } from "@/lib/personal/vaultClient";
import { forgetKey } from "@/lib/personal/keystore";
import { logAsText, planAsText } from "@/lib/personal/text";
import type { LogEntry, Plan } from "@/lib/personal/types";

function download(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Inner() {
  const key = useKey();
  const { reload } = useVault();
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  async function json() {
    setBusy("json");
    const all = await exportAll(key);
    download(`personal-gap-reader-${today}.json`, new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), records: all }, null, 2)], { type: "application/json" }));
    setBusy(null);
  }

  async function pdf() {
    setBusy("pdf");
    const all = await exportAll(key);
    const plan = all.find((r) => r.kind === "plan")?.data as Plan | undefined;
    const log = all.filter((r) => r.kind === "log").map((r) => r.data as LogEntry).sort((a, b) => a.date.localeCompare(b.date));
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const margin = 56, width = doc.internal.pageSize.getWidth() - margin * 2, bottom = doc.internal.pageSize.getHeight() - margin;
    let y = margin;
    const write = (text: string, size = 11, bold = false) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(size);
      for (const line of doc.splitTextToSize(text, width) as string[]) {
        if (y > bottom) { doc.addPage(); y = margin; }
        doc.text(line, margin, y);
        y += size * 1.4;
      }
      y += 4;
    };
    write("Personal Gap Reader", 18, true);
    write(`Exported ${today}. Private: keep this file somewhere only you can open it.`, 9);
    write("My ninety day plan", 14, true);
    write(planAsText(plan));
    write("My decision log", 14, true);
    write(log.length ? logAsText(log) : "(No decisions logged.)");
    doc.save(`personal-gap-reader-${today}.pdf`);
    setBusy(null);
  }

  return (
    <div className="space-y-6">
      <Card title="Export">
        <p>Your exports are decrypted in this browser. The JSON has everything except your AI key. The PDF has your plan and your decision log.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={pdf} disabled={!!busy}>{busy === "pdf" ? "Preparing…" : "Download PDF"}</Button>
          <Button onClick={json} variant="secondary" disabled={!!busy}>{busy === "json" ? "Preparing…" : "Download JSON"}</Button>
        </div>
      </Card>
      <Card tone="danger" title="Delete everything">
        <p>One action deletes your account, your vault and every record you have saved. It cannot be undone.</p>
        <form
          className="mt-4 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (confirm !== "DELETE") return setErr('Type DELETE to confirm.');
            setBusy("delete");
            try {
              await deleteEverything();
              await forgetKey();
              await reload().catch(() => undefined);
              window.location.href = "/personal/signin";
            } catch (e2) {
              setErr((e2 as Error).message);
              setBusy(null);
            }
          }}
        >
          <Field id="confirm" label='Type DELETE to confirm'><Input id="confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" /></Field>
          {err && <p role="alert" className="text-danger">{err}</p>}
          <Button type="submit" variant="danger" disabled={busy === "delete"}>Delete everything now</Button>
        </form>
      </Card>
    </div>
  );
}

export function ExportPage() {
  return (
    <Page title="Export and delete" intro="You own everything here.">
      <VaultGate><Inner /></VaultGate>
    </Page>
  );
}
