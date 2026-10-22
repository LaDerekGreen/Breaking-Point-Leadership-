import Link from "next/link";
import { Page, Card, Button, Flash, fmtDate } from "@/components/ui";
import { requireOrgUser } from "@/lib/org/session";
import { orgDb } from "@/lib/org/db";
import { audit } from "@/lib/org/audit";
import { getSettings } from "@/lib/org/settings";
import { back } from "@/lib/shared/flash";

export const metadata = { title: "Board and Outside Review" };

async function toggleCeo(formData: FormData) {
  "use server";
  const user = await requireOrgUser({ roles: ["board_reviewer"] });
  const enable = formData.get("enable") === "1";
  await orgDb.orgSettings.update({ where: { id: 1 }, data: { ceoReportsEnabled: enable } });
  await audit({ actorUserId: user.id, action: enable ? "board.ceo_reports_enabled" : "board.ceo_reports_disabled", entityType: "OrgSettings" });
  back("/org/board", enable ? "The chief executive's own report is now included, with the same five steps." : "The chief executive's report is no longer included.");
}

export default async function Board({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  await requireOrgUser({ roles: ["board_reviewer"] });
  const sp = await searchParams;
  const [settings, findings] = await Promise.all([
    getSettings(),
    orgDb.finding.findMany({ where: { OR: [{ state: "BOARD_REVIEW" }, { state: "RESOLVED", resolvedFromState: "BOARD_REVIEW" }] }, select: { id: true, leaderId: true, state: true, deliveredAt: true } }),
  ]);
  const people = await orgDb.person.findMany({ where: { id: { in: findings.map((f) => f.leaderId) } } });
  return (
    <Page title="Board and Outside Review" intro="Records reach the board only after a pattern persisted through the private correction window and an independent senior review, or when the leader has no one above them. Each is framed as fiduciary risk to the organization.">
      <Flash message={sp.msg} />
      <Card title="The chief executive's own report">
        <p>Put the most senior leader&apos;s report in front of someone first. When enabled, the chief executive is read like every other leader and moves through the same five steps, with a board reviewer as senior reviewer.</p>
        <form action={toggleCeo} className="mt-3">
          <input type="hidden" name="enable" value={settings.ceoReportsEnabled ? "0" : "1"} />
          <Button type="submit" variant={settings.ceoReportsEnabled ? "secondary" : "primary"}>{settings.ceoReportsEnabled ? "Turn off the chief executive's report" : "Include the chief executive's report"}</Button>
        </form>
      </Card>
      {findings.length === 0 && <Card>No record is in front of the board.</Card>}
      <ul className="space-y-3">
        {findings.map((f) => (
          <li key={f.id}>
            <Card>
              <Link href={`/org/findings/${f.id}`} prefetch={false} className="font-medium">{people.find((p) => p.id === f.leaderId)?.displayName}{people.find((p) => p.id === f.leaderId)?.isChiefExecutive ? " (chief executive)" : ""}</Link>
              <p className="text-sm text-muted">{f.state === "RESOLVED" ? "Resolved" : "Waiting for the board's judgment"}. First delivered {fmtDate(f.deliveredAt)}.</p>
            </Card>
          </li>
        ))}
      </ul>
    </Page>
  );
}
