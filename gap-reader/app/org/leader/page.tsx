import Link from "next/link";
import { Page, Card, fmtDate } from "@/components/ui";
import { requireOrgUser } from "@/lib/org/session";
import { orgDb } from "@/lib/org/db";
import { STEP_NAMES, type State } from "@/lib/org/escalation";
import { PATTERN_TITLES, type PatternKey } from "@/lib/org/patterns";

export const metadata = { title: "My reports" };

export default async function LeaderHome() {
  const user = await requireOrgUser({ roles: ["leader"] });
  if (!user.personId) return <Page title="My reports"><Card>Your account is not linked to the directory yet. Ask the program lead.</Card></Page>;
  const now = new Date();
  const [findings, timing, openCycles] = await Promise.all([
    orgDb.finding.findMany({ where: { leaderId: user.personId }, orderBy: { deliveredAt: "desc" }, select: { id: true, patternKey: true, state: true, deliveredAt: true, firstOpenedAt: true, windowEndsAt: true } }),
    orgDb.availabilityFlag.findMany({ where: { leaderPersonId: user.personId, waitUntil: { gte: now } }, orderBy: { waitUntil: "asc" } }),
    orgDb.surveyCycle.findMany({ where: { status: "open" } }),
  ]);
  const people = await orgDb.user.findMany({ where: { id: { in: timing.map((t) => t.userId) } }, include: { person: true } });
  return (
    <Page title="My reports" intro="Every finding comes to you first, privately. No one above you is told, and nothing enters your file, unless the same pattern persists after your full correction window and a person confirms it.">
      {timing.length > 0 && (
        <Card title="Timing" tone="accent">
          <ul className="space-y-1">
            {timing.map((t) => {
              const p = people.find((u) => u.id === t.userId);
              return <li key={t.id}>Consider holding non urgent conversations with {p?.person?.displayName ?? "a member of your team"} until {fmtDate(t.waitUntil)}.</li>;
            })}
          </ul>
        </Card>
      )}
      <Card title="Findings">
        {findings.length === 0 ? (
          <p className="text-muted">Nothing to show. Most leaders have few findings, and most findings are ordinary.</p>
        ) : (
          <ul className="space-y-3">
            {findings.map((f) => (
              <li key={f.id}>
                <Link href={`/org/findings/${f.id}`} prefetch={false} className="font-medium">{PATTERN_TITLES[f.patternKey as PatternKey] ?? "Finding"}</Link>
                <p className="text-sm text-muted">
                  {STEP_NAMES[f.state as State]}. Delivered {fmtDate(f.deliveredAt)}.{" "}
                  {f.firstOpenedAt ? (f.windowEndsAt ? `Correction window until ${fmtDate(f.windowEndsAt)}.` : "") : "Not opened yet. Your correction window starts when you open it."}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card title="Three Vantage Point Survey">
        <p>{openCycles.length ? "A survey cycle is open. Rate yourself on the same eight statements, so the gap can be measured." : "See how the people above, beside and below you experience your leadership, and where it differs from how you see yourself."}</p>
        <p><Link href="/org/leader/survey">Open survey results and self rating</Link></p>
      </Card>
    </Page>
  );
}
