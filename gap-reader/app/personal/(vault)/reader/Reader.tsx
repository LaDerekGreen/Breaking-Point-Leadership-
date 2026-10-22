"use client";

import { Page, Card } from "@/components/ui";
import { VaultGate } from "@/components/personal/VaultGate";
import { Conversations } from "@/components/personal/Conversations";
import { useRecord, useRecords } from "@/components/personal/hooks";
import { PERSONAL_GAP_READER_PROMPT } from "@/lib/ai/prompts";
import { IDS, type LogEntry, type Profile } from "@/lib/personal/types";
import { logAsText } from "@/lib/personal/text";

function Inner() {
  const { value: profile } = useRecord<Profile>("profile", IDS.profile);
  const { items: log } = useRecords<LogEntry>("log");
  const opening = [
    "The values I say I lead by:",
    profile?.values?.trim() || "(I have not written them yet. Ask me for them first.)",
    "",
    "Real decisions I have made:",
    log && log.length ? logAsText(log.map((l) => l.data).slice(0, 15)) : "(None logged yet. Ask me to describe three.)",
  ].join("\n");
  return (
    <>
      <Card>
        <p>Your Gap Reader compares the values you say you lead by with the decisions you describe, and tells you plainly where they do not match. Then it asks you reflection questions one at a time and helps you build a ninety day plan with no more than three commitments.</p>
      </Card>
      <Conversations kind="reader" title="Gap Reader" system={PERSONAL_GAP_READER_PROMPT} opening={profile === undefined || log === null ? null : opening} />
    </>
  );
}

export function Reader() {
  return (
    <Page title="Your Gap Reader">
      <VaultGate><Inner /></VaultGate>
    </Page>
  );
}
