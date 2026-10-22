import { Page, Card, Button, Field, Input, Select, Flash } from "@/components/ui";
import { requireOrgUser } from "@/lib/org/session";
import { back } from "@/lib/shared/flash";
import { ALLOWED_COLUMNS, IMPORT_KINDS, IMPORT_LABELS, FORBIDDEN_FIELD_PATTERNS, type ImportKind } from "@/lib/org/importSchema";
import { importRows, parseCsv } from "@/lib/org/importer";
import { currentNotice } from "@/lib/org/notice";

export const metadata = { title: "Import records" };
const PATH = "/org/lead/import";

async function upload(formData: FormData) {
  "use server";
  const user = await requireOrgUser({ roles: ["program_lead"], skipNotice: true });
  if (!(await currentNotice())) back(PATH, "Publish the Notice before importing any records.", "err");
  const kind = String(formData.get("kind")) as ImportKind;
  if (!IMPORT_KINDS.includes(kind)) back(PATH, "Choose what you are importing.", "err");
  const file = formData.get("file");
  if (!(file instanceof File) || !file.size) back(PATH, "Choose a CSV file.", "err");
  const { headers, rows } = parseCsv(await (file as File).text());
  const r = await importRows(kind, { fileName: (file as File).name, headers, rows }, user.id);
  if (!r.ok) back(PATH, [r.message, ...r.details].join("\n"), "err");
  back(PATH, r.message);
}

export default async function ImportPage({ searchParams }: { searchParams: Promise<{ msg?: string; err?: string }> }) {
  await requireOrgUser({ roles: ["program_lead"], skipNotice: true });
  const sp = await searchParams;
  return (
    <Page
      title="Import records"
      back={{ href: "/org/lead", label: "Program lead console" }}
      intro="Only records the organization already keeps. People appear by role and anonymous reference, and leaders by their directory ID. A file with any column outside its schema is rejected whole and the rejection is logged."
    >
      <Flash message={sp.msg} />
      <Flash message={sp.err} tone="danger" />
      <form action={upload} className="space-y-4">
        <Field id="kind" label="What is in this file">
          <Select id="kind" name="kind" required>
            {IMPORT_KINDS.map((k) => <option key={k} value={k}>{IMPORT_LABELS[k]}</option>)}
          </Select>
        </Field>
        <Field id="file" label="CSV file"><Input id="file" name="file" type="file" accept=".csv,text/csv" required /></Field>
        <Button type="submit">Import</Button>
      </form>
      <Card title="Allowed columns">
        <dl className="space-y-3 text-sm">
          {IMPORT_KINDS.map((k) => (
            <div key={k}>
              <dt className="font-medium">{IMPORT_LABELS[k]}</dt>
              <dd className="text-muted">{ALLOWED_COLUMNS[k].join(", ")}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <Card title="Always rejected" tone="warn">
        <p className="text-sm">Any column named or resembling: {FORBIDDEN_FIELD_PATTERNS.map((f) => f.label).join(", ")}.</p>
        <p className="text-sm">To add a data source not listed here, the change must be approved first. It is not a setting.</p>
      </Card>
      <Card title="API">
        <p className="text-sm text-muted">
          POST JSON to <code>/api/org/import/&lt;kind&gt;</code> with <code>Authorization: Bearer $IMPORT_API_TOKEN</code> and a body of <code>{"{ \"rows\": [ { ... } ] }"}</code>. The same schema rules apply.
        </p>
      </Card>
    </Page>
  );
}
