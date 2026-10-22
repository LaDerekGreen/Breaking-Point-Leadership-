"use client";

import { useEffect, useState } from "react";
import { Page, Card, Button } from "@/components/ui";
import { VaultGate } from "@/components/personal/VaultGate";
import { SourceInquiryCaution, CrisisNotice } from "@/components/personal/Caution";
import { SafeField } from "@/components/personal/SafeField";
import { Conversations } from "@/components/personal/Conversations";
import { useRecord } from "@/components/personal/hooks";
import { indicatesCrisis } from "@/lib/personal/crisis";
import { stripEmails } from "@/lib/personal/sanitize";
import { SOURCE_INQUIRY_CARD, SOURCE_INQUIRY_PROMPT } from "@/lib/ai/prompts";
import { IDS, type Inquiry } from "@/lib/personal/types";

const STEPS = [
  "Five words that describe me as a leader",
  "Where I first saw someone live that way",
  "That person, by what they did",
  "Decisions I cannot explain",
  "My question, on a card",
];

const blank = (): Inquiry => ({
  words: ["", "", "", "", ""],
  sources: Array.from({ length: 5 }, () => ({ word: "", who: "", did: "" })),
  decisions: Array.from({ length: 3 }, () => ({ decision: "", felt: "", sentence: "" })),
  card: SOURCE_INQUIRY_CARD,
  updatedAt: "",
});

function asText(q: Inquiry): string {
  return [
    "Five words that describe me as a leader: " + q.words.filter(Boolean).join(", "),
    "",
    "Where I first saw someone live that way:",
    ...q.words.map((w, i) => (w ? `- ${w}: ${q.sources[i].who || "(not sure yet)"}. What they did: ${q.sources[i].did || "(not written yet)"}` : "")).filter(Boolean),
    "",
    "Adult decisions I cannot explain:",
    ...q.decisions.filter((d) => d.decision).map((d, i) => `${i + 1}. ${d.decision}\n   What I felt right before: ${d.felt}\n   The sentence that went through my head: ${d.sentence}`),
    "",
    `My card: ${q.card}`,
  ].join("\n");
}

function Inner() {
  const { value, loading, save } = useRecord<Inquiry>("inquiry", IDS.inquiry);
  const [q, setQ] = useState<Inquiry>(blank);
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (value) setQ({ ...blank(), ...value });
  }, [value]);

  // Once crisis language appears, the session stops asking questions, even if the text is later changed.
  const [crisis, setCrisis] = useState(false);
  useEffect(() => {
    if (!crisis && indicatesCrisis(JSON.stringify(q))) setCrisis(true);
  }, [q, crisis]);
  if (loading) return <p role="status">Loading…</p>;

  async function persist(next = q) {
    const clean = JSON.parse(stripEmails(JSON.stringify(next))) as Inquiry;
    await save({ ...clean, updatedAt: new Date().toISOString() });
    setSaved(true);
  }

  const words = q.words;
  return (
    <div className="space-y-6">
      {crisis && <CrisisNotice />}
      <nav aria-label="Source Inquiry steps">
        <ol className="flex flex-wrap gap-2 text-sm">
          {STEPS.map((s, i) => (
            <li key={s}>
              <button onClick={() => setStep(i)} aria-current={i === step ? "step" : undefined} className={`min-h-11 rounded-full border px-3 py-1 ${i === step ? "border-accent bg-accent-soft font-semibold" : "border-line"}`}>
                {i + 1}. {s}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <Card title={`Step ${step + 1}: ${STEPS[step]}`}>
        <div className="space-y-4">
          {step === 0 && words.map((w, i) => (
            <SafeField key={i} id={`w${i}`} label={`Word ${i + 1}`} value={w} onChange={(v) => setQ({ ...q, words: words.map((x, j) => (j === i ? v : x)) })} />
          ))}
          {step === 1 && words.map((w, i) => w && (
            <SafeField key={i} id={`who${i}`} label={`${w}: where did I first see someone live that way?`} hint="Name the person by role: parent, grandparent, coach, pastor, first boss." value={q.sources[i].who} onChange={(v) => setQ({ ...q, sources: q.sources.map((s, j) => (j === i ? { ...s, word: w, who: v } : s)) })} />
          ))}
          {step === 2 && words.map((w, i) => w && (
            <SafeField key={i} id={`did${i}`} label={`${q.sources[i].who || w}: what did they do?`} hint="Describe what they did, not what they were." rows={3} value={q.sources[i].did} onChange={(v) => setQ({ ...q, sources: q.sources.map((s, j) => (j === i ? { ...s, word: w, did: v } : s)) })} />
          ))}
          {step === 3 && q.decisions.map((d, i) => (
            <fieldset key={i} className="space-y-3 rounded-md border border-line p-3">
              <legend className="px-1 font-medium">Decision {i + 1}{i === 2 ? " (optional)" : ""}</legend>
              <SafeField id={`dd${i}`} label="An adult decision I cannot explain" rows={2} value={d.decision} onChange={(v) => setQ({ ...q, decisions: q.decisions.map((x, j) => (j === i ? { ...x, decision: v } : x)) })} />
              <SafeField id={`df${i}`} label="What I felt right before" value={d.felt} onChange={(v) => setQ({ ...q, decisions: q.decisions.map((x, j) => (j === i ? { ...x, felt: v } : x)) })} />
              <SafeField id={`ds${i}`} label="The sentence that went through my head" value={d.sentence} onChange={(v) => setQ({ ...q, decisions: q.decisions.map((x, j) => (j === i ? { ...x, sentence: v } : x)) })} />
            </fieldset>
          ))}
          {step === 4 && (
            <div className="rounded-lg border-2 border-ink bg-card p-6 text-center font-serif text-2xl">{q.card}</div>
          )}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {step > 0 && <Button variant="secondary" onClick={() => setStep(step - 1)}>Back</Button>}
          <Button onClick={async () => { await persist(); if (step < 4) setStep(step + 1); }}>{step < 4 ? "Save and continue" : "Save"}</Button>
          {saved && <span role="status" className="self-center text-sm text-muted">Saved, encrypted.</span>}
        </div>
      </Card>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Talk it through</h2>
        <p className="text-muted">Your Gap Reader asks one question at a time, looks for repeated feelings, thoughts or situations, and shows you where your past might be making choices for your present. It does not diagnose.</p>
        {crisis ? (
          <Card tone="danger">This session will not ask further questions. Please talk with a person: 988 in the United States, or your local emergency number.</Card>
        ) : (
          <Conversations kind="inquiry" title="Source Inquiry" system={SOURCE_INQUIRY_PROMPT} opening={asText(q)} />
        )}
      </section>
      <SourceInquiryCaution />
    </div>
  );
}

export function SourceInquiry() {
  return (
    <Page title="The Source Inquiry" intro="Five steps toward one question: who am I answering right now?">
      <SourceInquiryCaution />
      <VaultGate><Inner /></VaultGate>
    </Page>
  );
}
