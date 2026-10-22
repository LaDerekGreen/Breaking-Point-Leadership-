import { Page, Table, LinkButton } from "@/components/ui";
import { requireOrgUser } from "@/lib/org/session";
import { orgDb } from "@/lib/org/db";

export const metadata = { title: "Audit log" };

export default async function Audit() {
  await requireOrgUser({ roles: ["program_lead"], skipNotice: true });
  const rows = await orgDb.auditLog.findMany({ orderBy: { at: "desc" }, take: 300 });
  const users = await orgDb.user.findMany({ where: { id: { in: [...new Set(rows.map((r) => r.actorUserId).filter(Boolean) as string[])] } } });
  const who = (id: string | null) => (id ? users.find((u) => u.id === id)?.email ?? id : "System");
  return (
    <Page title="Audit log" back={{ href: "/org/lead", label: "Program lead console" }} intro="Who, when, what and why. The most recent 300 entries are shown; the export has everything.">
      <LinkButton href="/api/org/audit">Export the full log (CSV)</LinkButton>
      <Table
        caption="Audit log"
        head={["When", "Who", "What", "Why"]}
        rows={rows.map((r) => [
          r.at.toISOString().replace("T", " ").slice(0, 16),
          who(r.actorUserId),
          <span key="a">{r.action}<br /><span className="text-xs text-muted">{r.entityType}{r.entityId ? ` ${r.entityId}` : ""}</span></span>,
          r.reason ?? "",
        ])}
      />
    </Page>
  );
}
