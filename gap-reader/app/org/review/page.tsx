import Link from "next/link";
import { Page, Card, fmtDate } from "@/components/ui";
import { requireOrgUser } from "@/lib/org/session";
import { orgDb } from "@/lib/org/db";
import { STEP_NAMES, type State } from "@/lib/org/escalation";

export const metadata = { title: "Senior Human Review" };

export default async function Review() {
  const user = await requireOrgUser({ roles: ["senior_reviewer", "board_reviewer"] });
  const assigned = await orgDb.reviewerAssignment.findMany({ where: { seniorReviewerUserId: user.id } });
  const findings = await orgDb.finding.findMany({
    where: { leaderId: { in: assigned.map((a) => a.leaderPersonId) }, OR: [{ state: { in: ["SENIOR_REVIEW", "BOARD_REVIEW"] } }, { state: "RESOLVED", resolvedFromState: { in: ["SENIOR_REVIEW", "BOARD_REVIEW"] } }] },
    select: { id: true, leaderId: true, state: true, deliveredAt: true },
  });
  const people = await orgDb.person.findMany({ where: { id: { in: findings.map((f) => f.leaderId) } } });
  return (
    <Page title="Senior Human Review" intro="You were chosen because you are more experienced and have no reporting stake in the outcome. Read the same report the leader saw and the leader's own responses, then write your own independent judgment.">
      {findings.length === 0 && <Card>Nothing is waiting for you.</Card>}
      <ul className="space-y-3">
        {findings.map((f) => (
          <li key={f.id}>
            <Card>
              <Link href={`/org/findings/${f.id}`} prefetch={false} className="font-medium">{people.find((p) => p.id === f.leaderId)?.displayName}</Link>
              <p className="text-sm text-muted">{STEP_NAMES[f.state as State]}. First delivered {fmtDate(f.deliveredAt)}.</p>
            </Card>
          </li>
        ))}
      </ul>
    </Page>
  );
}
