import "server-only";
import { orgDb } from "./db";
import { audit } from "./audit";
import { isRole, type Role } from "./roles";
import { parseCsv } from "./importer";

export type DirectoryRow = {
  externalId: string;
  displayName: string;
  roleTitle: string;
  jobLevel?: string;
  managerExternalId?: string;
  isChiefExecutive?: boolean;
  email?: string;
  roles?: Role[];
};

/**
 * The admin directory: the only place a name exists. It is never read by the
 * analysis and never passed to the AI adapter.
 */
export async function upsertPeople(rows: DirectoryRow[], actorUserId: string) {
  for (const r of rows) {
    await orgDb.person.upsert({
      where: { externalId: r.externalId },
      create: { externalId: r.externalId, displayName: r.displayName, roleTitle: r.roleTitle, jobLevel: r.jobLevel || null, isChiefExecutive: !!r.isChiefExecutive },
      update: { displayName: r.displayName, roleTitle: r.roleTitle, jobLevel: r.jobLevel || null, isChiefExecutive: !!r.isChiefExecutive },
    });
  }
  for (const r of rows) {
    const manager = r.managerExternalId ? await orgDb.person.findUnique({ where: { externalId: r.managerExternalId } }) : null;
    const p = await orgDb.person.update({ where: { externalId: r.externalId }, data: { managerId: manager?.id ?? null } });
    if (r.email) {
      const email = r.email.trim().toLowerCase();
      const roles = r.roles?.length ? r.roles : (["respondent"] as Role[]);
      const existing = await orgDb.user.findUnique({ where: { email } });
      if (existing) await orgDb.user.update({ where: { id: existing.id }, data: { personId: p.id, roles } });
      else await orgDb.user.create({ data: { email, personId: p.id, roles } });
    }
  }
  await audit({ actorUserId, action: "directory.updated", entityType: "Person", meta: { rows: rows.length } });
}

export function parseDirectoryCsv(text: string): { rows: DirectoryRow[]; errors: string[] } {
  const { rows } = parseCsv(text);
  const errors: string[] = [];
  const out: DirectoryRow[] = [];
  rows.forEach((r, i) => {
    const get = (k: string) => (r[k] ?? "").trim();
    if (!get("external_id") || !get("display_name") || !get("role_title")) {
      errors.push(`Row ${i + 2}: external_id, display_name and role_title are required.`);
      return;
    }
    const roles = get("roles").split(/[;|]/).map((x) => x.trim()).filter(Boolean);
    const bad = roles.filter((x) => !isRole(x));
    if (bad.length) errors.push(`Row ${i + 2}: unknown role ${bad.join(", ")}.`);
    out.push({
      externalId: get("external_id"),
      displayName: get("display_name"),
      roleTitle: get("role_title"),
      jobLevel: get("job_level"),
      managerExternalId: get("manager_external_id"),
      isChiefExecutive: /^(1|true|yes)$/i.test(get("is_chief_executive")),
      email: get("email"),
      roles: roles.filter(isRole),
    });
  });
  return { rows: out, errors };
}
