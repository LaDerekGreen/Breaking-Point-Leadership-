"use client";

import Link from "next/link";
import { Page, Card } from "@/components/ui";
import { VaultGate } from "@/components/personal/VaultGate";
import { useRecord, useRecords } from "@/components/personal/hooks";
import { IDS, type LogEntry, type Plan, type Profile } from "@/lib/personal/types";

function Dashboard() {
  const { value: plan } = useRecord<Plan>("plan", IDS.plan);
  const { value: profile } = useRecord<Profile>("profile", IDS.profile);
  const { items: log } = useRecords<LogEntry>("log");
  const week = plan ? Math.min(13, Math.floor((Date.now() - new Date(plan.startedAt).getTime()) / (7 * 86400000)) + 1) : null;
  return (
    <div className="space-y-6">
      {(plan?.breakingPoint || profile?.breakingPoint) && (
        <Card tone="accent" title="My breaking point">
          <p className="font-serif text-xl">{plan?.breakingPoint || profile?.breakingPoint}</p>
        </Card>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Tile href="/personal/reader" title="Talk with your Gap Reader" text="Tell it the values you say you lead by and the real decisions you made. It shows you where they do not match." />
        <Tile href="/personal/log" title="Decision log" text={`${log?.length ?? 0} decisions logged. Five minutes per decision, for ninety days.`} />
        <Tile href="/personal/checkin" title="Weekly check-in" text="Where the record and the plan no longer match." />
        <Tile href="/personal/inquiry" title="Source Inquiry" text="Five steps toward who you are answering when you decide." />
        <Tile href="/personal/workbook" title="The workbook" text="Nine exercises, one at a time." />
        <Tile href="/personal/plan" title="Ninety day plan" text={plan ? `Week ${week} of 13. ${plan.commitments.length} of 3 commitments.` : "No more than three commitments."} />
      </div>
    </div>
  );
}

function Tile({ href, title, text }: { href: string; title: string; text: string }) {
  return (
    <Link href={href} className="block rounded-lg border border-line bg-card p-4 no-underline hover:border-accent">
      <span className="font-semibold text-accent">{title}</span>
      <span className="mt-1 block text-sm text-muted">{text}</span>
    </Link>
  );
}

export function PersonalHome() {
  return (
    <Page title="Your Personal Gap Reader" intro="The gap between the leader you say you are and the decisions you actually make, seen privately, by you.">
      <VaultGate>
        <Dashboard />
      </VaultGate>
    </Page>
  );
}
