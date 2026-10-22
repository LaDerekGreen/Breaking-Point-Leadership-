"use client";

import { useEffect, useState } from "react";
import { Page, Card, Button } from "@/components/ui";
import { VaultGate } from "@/components/personal/VaultGate";
import { SafeField } from "@/components/personal/SafeField";
import { useRecord } from "@/components/personal/hooks";
import { exercise } from "@/lib/book/workbook";
import { stripEmails } from "@/lib/personal/sanitize";
import { IDS, MAX_COMMITMENTS, type Commitment, type Plan, type WorkbookEntry } from "@/lib/personal/types";

const blank = (): Plan => ({ breakingPoint: "", commitments: [{ text: "", measure: "", who: "" }], weeksDone: [], startedAt: new Date().toISOString() });

function Inner() {
  const e = exercise(9)!;
  const { value, loading, save } = useRecord<Plan>("plan", IDS.plan);
  const { value: ex1 } = useRecord<WorkbookEntry>("workbook", "workbook-1");
  const [plan, setPlan] = useState<Plan>(blank);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (value) setPlan(value);
    else if (ex1?.answers.sentence) setPlan((p) => ({ ...p, breakingPoint: p.breakingPoint || ex1.answers.sentence }));
  }, [value, ex1]);
  if (loading) return <p role="status">Loading…</p>;

  const setC = (i: number, k: keyof Commitment, v: string) => { setSaved(false); setPlan({ ...plan, commitments: plan.commitments.map((c, j) => (j === i ? { ...c, [k]: v } : c)) }); };
  const toggleWeek = (w: number) => setPlan({ ...plan, weeksDone: plan.weeksDone.includes(w) ? plan.weeksDone.filter((x) => x !== w) : [...plan.weeksDone, w] });

  return (
    <form
      className="space-y-6"
      onSubmit={async (ev) => {
        ev.preventDefault();
        const commitments = plan.commitments.filter((c) => c.text.trim()).slice(0, MAX_COMMITMENTS).map((c) => ({ text: stripEmails(c.text), measure: stripEmails(c.measure), who: stripEmails(c.who) }));
        await save({ ...plan, breakingPoint: stripEmails(plan.breakingPoint), commitments });
        setSaved(true);
      }}
    >
      <Card>{e.body.map((p) => <p key={p}>{p}</p>)}</Card>
      <Card title="My breaking point">
        <SafeField id="bp" label='One sentence, beginning with "When"' rows={2} value={plan.breakingPoint} onChange={(v) => { setSaved(false); setPlan({ ...plan, breakingPoint: v }); }} />
      </Card>
      <Card title={`Commitments (no more than ${MAX_COMMITMENTS})`}>
        <div className="space-y-6">
          {plan.commitments.map((c, i) => (
            <fieldset key={i} className="space-y-3 rounded-md border border-line p-3">
              <legend className="px-1 font-medium">Commitment {i + 1}</legend>
              <SafeField id={`c${i}`} label="What I will do" rows={2} value={c.text} onChange={(v) => setC(i, "text", v)} />
              <SafeField id={`m${i}`} label="How I will measure it" value={c.measure} onChange={(v) => setC(i, "measure", v)} />
              <SafeField id={`w${i}`} label="Who will hold me to it (a role, not a name)" value={c.who} onChange={(v) => setC(i, "who", v)} />
              {plan.commitments.length > 1 && <Button type="button" variant="danger" onClick={() => setPlan({ ...plan, commitments: plan.commitments.filter((_, j) => j !== i) })}>Remove</Button>}
            </fieldset>
          ))}
          {plan.commitments.length < MAX_COMMITMENTS ? (
            <Button type="button" variant="secondary" onClick={() => setPlan({ ...plan, commitments: [...plan.commitments, { text: "", measure: "", who: "" }] })}>Add a commitment</Button>
          ) : (
            <p className="text-sm text-muted">Three is the limit. Three changes that last are worth more than thirty that disappear.</p>
          )}
        </div>
      </Card>
      <Card title="Thirteen weeks">
        <ol className="space-y-2">
          {(e.weeks ?? []).map((w, i) => (
            <li key={i}>
              <label className="flex min-h-11 items-center gap-3">
                <input type="checkbox" checked={plan.weeksDone.includes(i + 1)} onChange={() => { setSaved(false); toggleWeek(i + 1); }} />
                <span><span className="font-medium">Week {i + 1}.</span> {w}</span>
              </label>
            </li>
          ))}
        </ol>
        {e.after?.map((p) => <p key={p} className="mt-4 text-sm text-muted">{p}</p>)}
      </Card>
      <div className="flex items-center gap-3">
        <Button type="submit">Save my plan</Button>
        {saved && <span role="status" className="text-sm text-muted">Saved, encrypted.</span>}
      </div>
    </form>
  );
}

export function PlanPage() {
  return (
    <Page title="Your ninety day plan" back={{ href: "/personal/workbook", label: "The workbook" }}>
      <VaultGate><Inner /></VaultGate>
    </Page>
  );
}
