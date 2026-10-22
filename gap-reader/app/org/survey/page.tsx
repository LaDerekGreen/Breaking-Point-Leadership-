import Link from "next/link";
import { Page, Card } from "@/components/ui";
import { requireOrgUser } from "@/lib/org/session";
import { orgDb } from "@/lib/org/db";

export const metadata = { title: "Surveys" };

export default async function Surveys({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const user = await requireOrgUser();
  const sp = await searchParams;
  const invites = await orgDb.surveyInvitation.findMany({ where: { userId: user.id, cycle: { status: "open" } }, include: { cycle: true } });
  const leaders = await orgDb.person.findMany({ where: { id: { in: invites.map((i) => i.leaderId) } } });
  return (
    <Page title="Surveys" intro="Your answers are anonymous. No names are collected, and no result is shown for any group smaller than eight people.">
      {sp.msg && <Card tone="accent">{sp.msg}</Card>}
      {invites.length === 0 && <Card>No surveys are waiting for you.</Card>}
      <ul className="space-y-3">
        {invites.map((i) => {
          const l = leaders.find((p) => p.id === i.leaderId);
          return (
            <li key={i.id}>
              <Card>
                <p className="font-medium">{l?.displayName ?? "A leader"}, {l?.roleTitle}</p>
                <p className="text-sm text-muted">{i.cycle.name}</p>
                <p className="mt-2">{i.completed ? "Answered. Thank you." : <Link href={`/org/survey/${i.id}`}>Answer this survey</Link>}</p>
              </Card>
            </li>
          );
        })}
      </ul>
    </Page>
  );
}
