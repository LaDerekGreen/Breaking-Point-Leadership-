"use client";

import Link from "next/link";
import { Page, Card } from "@/components/ui";
import { VaultGate } from "@/components/personal/VaultGate";
import { Conversations } from "@/components/personal/Conversations";
import { useRecord, useRecords } from "@/components/personal/hooks";
import { PERSONAL_GAP_READER_PROMPT, WEEKLY_CHECKIN_PROMPT } from "@/lib/ai/prompts";
import { IDS, type LogEntry, type Plan } from "@/lib/personal/types";
import { inLastDays, logAsText, planAsText } from "@/lib/personal/text";

function Inner() {
  const { items } = useRecords<LogEntry>("log");
  const { value: plan } = useRecord<Plan>("plan", IDS.plan);
  const week = items ? inLastDays(items, 7) : [];
  const ready = items !== null && plan !== undefined;
  const opening = `${WEEKLY_CHECKIN_PROMPT}\n\nMy decision log for this week:\n${week.length ? logAsText(week) : "(No decisions logged this week.)"}\n\nMy ninety day plan:\n${planAsText(plan)}`;
  return (
    <>
      <Card tone="warn">
        Describe people by role, not name, and leave out confidential details. Email addresses are removed before anything is sent. What is sent goes from this browser to your own AI provider only.
      </Card>
      <Card>
        <p>This week: {week.length} decision{week.length === 1 ? "" : "s"} logged. {plan ? `${plan.commitments.length} commitment${plan.commitments.length === 1 ? "" : "s"} in your plan.` : <>No plan yet. <Link href="/personal/plan">Write your plan</Link>.</>}</p>
      </Card>
      <Conversations kind="checkin" title={`Check-in ${new Date().toISOString().slice(0, 10)}`} system={PERSONAL_GAP_READER_PROMPT} opening={ready ? opening : null} />
    </>
  );
}

export function Checkin() {
  return (
    <Page title="Weekly check-in" intro="Your week's log and your plan, side by side. Where do the record and the plan no longer match?">
      <VaultGate><Inner /></VaultGate>
    </Page>
  );
}
