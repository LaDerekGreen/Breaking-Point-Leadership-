"use client";

import { useMemo, useState } from "react";
import { Page, Card, Button, Field, Input, Table, Textarea } from "@/components/ui";
import { VaultGate } from "@/components/personal/VaultGate";
import { useKey } from "@/components/personal/VaultProvider";
import { SafeField } from "@/components/personal/SafeField";
import { Conversations } from "@/components/personal/Conversations";
import { useRecords } from "@/components/personal/hooks";
import { deleteRecord, newId, saveRecord } from "@/lib/personal/vaultClient";
import { stripEmails } from "@/lib/personal/sanitize";
import { logAsText } from "@/lib/personal/text";
import type { LogEntry } from "@/lib/personal/types";
import { MONTHLY_READBACK_PROMPT, MONTHLY_READBACK_QUESTIONS, PERSONAL_GAP_READER_PROMPT } from "@/lib/ai/prompts";

const empty = (): LogEntry => ({ date: new Date().toISOString().slice(0, 10), decision: "", affected: "", pressure: "", questions: "", alternatives: "", createdAt: "" });

function countQuestions(q: string): number {
  const marks = (q.match(/\?/g) ?? []).length;
  const lines = q.split(/\n|;/).map((l) => l.trim()).filter(Boolean).length;
  return Math.max(marks, lines);
}

function Inner() {
  const key = useKey();
  const { items, reload } = useRecords<LogEntry>("log");
  const [draft, setDraft] = useState<LogEntry>(empty);
  const [busy, setBusy] = useState(false);
  const months = useMemo(() => [...new Set((items ?? []).map((i) => i.data.date.slice(0, 7)))].sort().reverse(), [items]);
  const [month, setMonth] = useState<string>("");
  const m = month || months[0] || "";
  const monthEntries = (items ?? []).map((i) => i.data).filter((e) => e.date.startsWith(m)).sort((a, b) => a.date.localeCompare(b.date));
  const { items: readbacks, reload: reloadRb } = useRecords<{ month: string; answers: string[] }>("readback");
  const rb = readbacks?.find((r) => r.data.month === m);
  const [answers, setAnswers] = useState<string[] | null>(null);
  const shownAnswers = answers ?? rb?.data.answers ?? ["", "", ""];

  const set = (k: keyof LogEntry) => (v: string) => setDraft((d) => ({ ...d, [k]: v }));
  const sorted = [...(items ?? [])].sort((a, b) => b.data.date.localeCompare(a.data.date));

  return (
    <div className="space-y-8">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const clean = Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, typeof v === "string" ? stripEmails(v).trim() : v])) as LogEntry;
          await saveRecord(key, "log", newId(), { ...clean, createdAt: new Date().toISOString() });
          setDraft(empty());
          setBusy(false);
          await reload();
        }}
      >
        <Card title="Log a decision">
          <p className="mb-4 text-sm text-muted">Every significant decision that affects someone else&apos;s work, assignment, evaluation, or opportunity. Describe people by role, not name. Email addresses are removed when you save.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="date" label="Date"><Input id="date" type="date" value={draft.date} onChange={(e) => set("date")(e.target.value)} required /></Field>
            <SafeField id="affected" label="Who it affected (role, not name)" value={draft.affected} onChange={set("affected")} />
          </div>
          <div className="mt-4 space-y-4">
            <SafeField id="decision" label="Decision" value={draft.decision} onChange={set("decision")} rows={2} required />
            <SafeField id="pressure" label="Pressure I was under" value={draft.pressure} onChange={set("pressure")} rows={2} />
            <SafeField id="questions" label="Questions I asked first" hint="One per line." value={draft.questions} onChange={set("questions")} rows={2} />
            <SafeField id="alternatives" label="Alternatives I considered" value={draft.alternatives} onChange={set("alternatives")} rows={2} />
          </div>
          <div className="mt-4"><Button type="submit" disabled={busy}>Save to my log</Button></div>
        </Card>
      </form>

      <Table
        caption="My decision log"
        head={["Date", "Decision", "Who it affected", "Pressure", "Questions first", "Alternatives", ""]}
        rows={sorted.map((r) => [
          r.data.date,
          r.data.decision,
          r.data.affected,
          r.data.pressure,
          <span key="q" className="whitespace-pre-line">{r.data.questions}</span>,
          r.data.alternatives,
          <Button key="d" variant="danger" className="min-h-8 px-2 py-1 text-xs" onClick={async () => { await deleteRecord(r.id); await reload(); }} aria-label={`Delete decision of ${r.data.date}`}>Delete</Button>,
        ])}
      />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Monthly read-back</h2>
        <p className="text-muted">At the end of each month, read the log from top to bottom and answer three questions.</p>
        {months.length === 0 ? (
          <Card>Log a few decisions first.</Card>
        ) : (
          <>
            <label className="flex items-center gap-2">
              <span>Month</span>
              <select className="min-h-11 rounded-md border border-line bg-card px-2" value={m} onChange={(e) => { setMonth(e.target.value); setAnswers(null); }}>
                {months.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </label>
            <Card>
              <p className="text-sm text-muted">{monthEntries.length} decisions this month. {monthEntries.filter((e) => countQuestions(e.questions) >= 2).length} list at least two questions asked first.</p>
              <form
                className="mt-4 space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  await saveRecord(key, "readback", `readback-${m}`, { month: m, answers: shownAnswers.map((a) => stripEmails(a)) });
                  await reloadRb();
                }}
              >
                {MONTHLY_READBACK_QUESTIONS.map((q, i) => (
                  <Field key={q} id={`rb${i}`} label={q}>
                    <Textarea id={`rb${i}`} rows={3} value={shownAnswers[i]} onChange={(e) => setAnswers(shownAnswers.map((a, j) => (j === i ? e.target.value : a)))} />
                  </Field>
                ))}
                <Button type="submit" variant="secondary">Save my read-back</Button>
              </form>
            </Card>
            <Conversations
              kind="readback"
              title={`Read-back ${m}`}
              system={PERSONAL_GAP_READER_PROMPT}
              opening={`${MONTHLY_READBACK_PROMPT}\n\n${logAsText(monthEntries)}`}
              filter={(c) => c.title === `Read-back ${m}`}
            />
          </>
        )}
      </section>
    </div>
  );
}

export function DecisionLog() {
  return (
    <Page title="Decision log" intro="Five minutes per decision, for ninety days. The log will feel tedious for two weeks. Then it will start to show you things.">
      <VaultGate><Inner /></VaultGate>
    </Page>
  );
}
