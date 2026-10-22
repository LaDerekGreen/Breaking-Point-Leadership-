"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Page, Card, Button } from "@/components/ui";
import { VaultGate } from "@/components/personal/VaultGate";
import { SafeField } from "@/components/personal/SafeField";
import { Conversations } from "@/components/personal/Conversations";
import { useRecord } from "@/components/personal/hooks";
import { exercise, exerciseAsText, type WorkbookField } from "@/lib/book/workbook";
import { SCALE, SURVEY_STATEMENTS, selfStatement } from "@/lib/book/survey";
import { PERSONAL_GAP_READER_PROMPT, WORKBOOK_EXERCISE_PROMPT } from "@/lib/ai/prompts";
import { stripEmails } from "@/lib/personal/sanitize";
import type { WorkbookEntry } from "@/lib/personal/types";

const SELF = SURVEY_STATEMENTS.map(selfStatement);

function Fields({ fields, answers, set }: { fields: WorkbookField[]; answers: Record<string, string>; set: (k: string, v: string) => void }) {
  return (
    <div className="space-y-4">
      {fields.map((f) => (
        <SafeField key={f.key} id={f.key} label={f.label} rows={f.type === "text" ? 1 : f.rows ?? 4} value={answers[f.key] ?? ""} onChange={(v) => set(f.key, v)} />
      ))}
    </div>
  );
}

function Inner({ id }: { id: number }) {
  const e = exercise(id)!;
  const { value, loading, save } = useRecord<WorkbookEntry>("workbook", `workbook-${id}`);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [rating, setRating] = useState<number[]>([]);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (value) {
      setAnswers(value.answers);
      setRating(value.selfRating ?? []);
    }
  }, [value]);
  if (loading) return <p role="status">Loading…</p>;
  const set = (k: string, v: string) => { setSaved(false); setAnswers((a) => ({ ...a, [k]: v })); };

  return (
    <div className="space-y-6">
      <Card>
        <p className="text-sm text-muted">{e.time}</p>
        {e.body.map((p) => <p key={p}>{p}</p>)}
        {e.list && <ul className="mt-3 list-disc space-y-1 pl-5">{e.list.map((l) => <li key={l}>{l}</li>)}</ul>}
        {e.after?.map((p) => <p key={p} className="mt-3">{p}</p>)}
      </Card>

      <form
        className="space-y-6"
        onSubmit={async (ev) => {
          ev.preventDefault();
          const clean = Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, stripEmails(v)]));
          await save({ exerciseId: id, answers: clean, selfRating: e.selfRatingOnly ? rating : undefined, updatedAt: new Date().toISOString() });
          setSaved(true);
        }}
      >
        {e.selfRatingOnly && (
          <Card title="Rate yourself">
            <p className="text-sm text-muted">In the Personal Gap Reader this is a self rating only. If your organization runs the Organizational Gap Reader, the real survey of the people above, beside and below you happens there, anonymously.</p>
            <ol className="mt-4 space-y-4">
              {SELF.map((s, i) => (
                <li key={i}>
                  <fieldset>
                    <legend className="font-medium">{i + 1}. {s}</legend>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {SCALE.map((o) => (
                        <label key={o.value} className="flex min-h-11 items-center gap-1 rounded-md border border-line px-2 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
                          <input type="radio" name={`r${i}`} value={o.value} checked={rating[i] === o.value} onChange={() => { const r = [...rating]; r[i] = o.value; setRating(r); setSaved(false); }} /> {o.value}. {o.label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </li>
              ))}
            </ol>
          </Card>
        )}
        {id === 3 && <Card>Your decisions go in the <Link href="/personal/log">decision log</Link>. Record each monthly read here.</Card>}
        {e.fields.length > 0 && <Card title="My answers"><Fields fields={e.fields} answers={answers} set={set} /></Card>}
        {e.howIShare && (
          <Card title={e.howIShare.title}>
            <p className="mb-4">{e.howIShare.body}</p>
            <Fields fields={e.howIShare.fields} answers={answers} set={set} />
          </Card>
        )}
        <div className="flex items-center gap-3">
          <Button type="submit">Save</Button>
          {saved && <span role="status" className="text-sm text-muted">Saved, encrypted.</span>}
        </div>
      </form>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Walk through it with your Gap Reader</h2>
        <Conversations
          kind="workbook"
          title={`Exercise ${id}: ${e.title}`}
          system={PERSONAL_GAP_READER_PROMPT}
          opening={`${WORKBOOK_EXERCISE_PROMPT}\n\n${exerciseAsText(e, answers, e.selfRatingOnly ? rating : undefined, e.selfRatingOnly ? SELF : undefined)}`}
          filter={(c) => c.title === `Exercise ${id}: ${e.title}`}
        />
      </section>
    </div>
  );
}

export function ExerciseForm({ id }: { id: number }) {
  const e = exercise(id)!;
  return (
    <Page title={`Exercise ${id}. ${e.title}`} back={{ href: "/personal/workbook", label: "The workbook" }}>
      <VaultGate><Inner id={id} /></VaultGate>
    </Page>
  );
}
