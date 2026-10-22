import { currentOrgUser } from "@/lib/org/session";
import { orgDb } from "@/lib/org/db";
import { audit } from "@/lib/org/audit";

const csv = (v: unknown) => {
  const s = v == null ? "" : typeof v === "string" ? v : JSON.stringify(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET() {
  const user = await currentOrgUser();
  if (!user || !user.roles.includes("program_lead")) return new Response("Forbidden", { status: 403 });
  const rows = await orgDb.auditLog.findMany({ orderBy: { at: "asc" } });
  await audit({ actorUserId: user.id, action: "audit.exported", entityType: "AuditLog", meta: { rows: rows.length } });
  const lines = [
    "at,actor_user_id,actor_kind,action,entity_type,entity_id,reason,meta",
    ...rows.map((r) => [r.at.toISOString(), r.actorUserId, r.actorKind, r.action, r.entityType, r.entityId, r.reason, r.meta].map(csv).join(",")),
  ];
  return new Response(lines.join("\n"), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="gap-reader-audit-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
}
