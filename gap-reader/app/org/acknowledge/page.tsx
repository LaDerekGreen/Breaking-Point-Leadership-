import { redirect } from "next/navigation";
import { Page, Card, Button } from "@/components/ui";
import { currentNotice, hasAcknowledgedCurrent, lines } from "@/lib/org/notice";
import { requireOrgUser } from "@/lib/org/session";
import { orgDb } from "@/lib/org/db";
import { audit } from "@/lib/org/audit";

export const metadata = { title: "Read the Notice" };

async function acknowledge() {
  "use server";
  const user = await requireOrgUser({ skipNotice: true });
  const n = await currentNotice();
  if (!n) redirect("/org/waiting");
  await orgDb.noticeAcknowledgment.upsert({
    where: { userId_noticeId: { userId: user.id, noticeId: n.id } },
    create: { userId: user.id, noticeId: n.id },
    update: {},
  });
  await audit({ actorUserId: user.id, action: "notice.acknowledged", entityType: "Notice", entityId: n.id, meta: { version: n.version } });
  redirect("/org");
}

export default async function Acknowledge() {
  const user = await requireOrgUser({ skipNotice: true });
  const n = await currentNotice();
  if (!n) redirect(user.roles.includes("program_lead") ? "/org/lead/notice" : "/org/waiting");
  if (await hasAcknowledgedCurrent(user.id)) redirect("/org");
  return (
    <Page title="Before anything else, read the Notice" intro="You need to acknowledge this Notice before you can take a survey or appear in any report.">
      <Card title="The Gap Reader reads">
        <ul className="list-disc space-y-2 pl-5">{lines(n.reads).map((l) => <li key={l}>{l}</li>)}</ul>
      </Card>
      <Card title="It never reads, and never does">
        <ul className="list-disc space-y-2 pl-5">{lines(n.neverReads).map((l) => <li key={l}>{l}</li>)}</ul>
      </Card>
      <form action={acknowledge}>
        <Button type="submit">I have read this Notice</Button>
      </form>
    </Page>
  );
}
