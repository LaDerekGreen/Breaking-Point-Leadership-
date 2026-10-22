import { Page, Card, Button, Field, Input, Textarea, Flash, Table } from "@/components/ui";
import { requireOrgUser } from "@/lib/org/session";
import { orgDb } from "@/lib/org/db";
import { audit } from "@/lib/org/audit";
import { back } from "@/lib/shared/flash";
import { ORG_ROLES, ROLE_LABELS, isRole } from "@/lib/org/roles";
import { parseDirectoryCsv, upsertPeople } from "@/lib/org/directory";

export const metadata = { title: "Directory" };
const PATH = "/org/lead/people";

async function importDirectory(formData: FormData) {
  "use server";
  const user = await requireOrgUser({ roles: ["program_lead"], skipNotice: true });
  const file = formData.get("file");
  const text = file instanceof File && file.size ? await file.text() : String(formData.get("csv") ?? "");
  if (!text.trim()) back(PATH, "Choose a file or paste CSV.", "err");
  const { rows, errors } = parseDirectoryCsv(text);
  if (errors.length) back(PATH, errors.slice(0, 10).join("\n"), "err");
  await upsertPeople(rows, user.id);
  back(PATH, `${rows.length} people saved.`);
}

async function setRoles(formData: FormData) {
  "use server";
  const user = await requireOrgUser({ roles: ["program_lead"], skipNotice: true });
  const userId = String(formData.get("userId"));
  const roles = formData.getAll("roles").map(String).filter(isRole);
  const target = await orgDb.user.findUniqueOrThrow({ where: { id: userId } });
  if (target.id === user.id && !roles.includes("program_lead")) back(PATH, "You cannot remove your own program lead role.", "err");
  await orgDb.user.update({ where: { id: userId }, data: { roles } });
  await audit({ actorUserId: user.id, action: "directory.roles_changed", entityType: "User", entityId: userId, meta: { roles } });
  back(PATH, "Roles saved.");
}

export default async function People({ searchParams }: { searchParams: Promise<{ msg?: string; err?: string }> }) {
  await requireOrgUser({ roles: ["program_lead"], skipNotice: true });
  const sp = await searchParams;
  const people = await orgDb.person.findMany({ include: { user: true, manager: true }, orderBy: { displayName: "asc" } });
  return (
    <Page
      title="Directory"
      back={{ href: "/org/lead", label: "Program lead console" }}
      intro="The admin directory is the only place a name is kept. Records and reports use roles and anonymous IDs, and names are never passed to the AI."
    >
      <Flash message={sp.msg} />
      <Flash message={sp.err} tone="danger" />
      <Card title="Import or update the directory">
        <p className="text-sm text-muted">
          Columns: external_id, display_name, role_title, job_level, manager_external_id, is_chief_executive, email, roles (separated by semicolons: {ORG_ROLES.join("; ")}). Only people with an email here can sign in.
        </p>
        <form action={importDirectory} className="mt-4 space-y-4">
          <Field id="file" label="CSV file"><Input id="file" name="file" type="file" accept=".csv,text/csv" /></Field>
          <Field id="csv" label="Or paste CSV"><Textarea id="csv" name="csv" rows={4} /></Field>
          <Button type="submit">Save directory</Button>
        </form>
      </Card>
      <Table
        caption="People"
        head={["Name", "Role", "Reports to", "Account and roles"]}
        rows={people.map((p) => [
          <span key="n">{p.displayName}{p.isChiefExecutive ? " (chief executive)" : ""}<br /><span className="text-xs text-muted">{p.externalId}</span></span>,
          p.roleTitle,
          p.manager?.displayName ?? "",
          p.user ? (
            <form key="r" action={setRoles} className="space-y-1">
              <input type="hidden" name="userId" value={p.user.id} />
              <span className="block text-xs text-muted">{p.user.email}</span>
              <fieldset className="flex flex-wrap gap-x-3">
                <legend className="sr-only">Roles for {p.displayName}</legend>
                {ORG_ROLES.map((r) => (
                  <label key={r} className="inline-flex items-center gap-1 text-xs">
                    <input type="checkbox" name="roles" value={r} defaultChecked={p.user!.roles.includes(r)} /> {ROLE_LABELS[r]}
                  </label>
                ))}
              </fieldset>
              <Button type="submit" variant="secondary" className="min-h-8 px-2 py-1 text-xs">Save roles</Button>
            </form>
          ) : (
            <span className="text-muted">No account</span>
          ),
        ])}
      />
    </Page>
  );
}
