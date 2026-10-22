import { Page, Card, Button, Field, Textarea, Flash, fmtDate } from "@/components/ui";
import { requireOrgUser } from "@/lib/org/session";
import { currentNotice, draftNotice, DEFAULT_NOTICE } from "@/lib/org/notice";
import { orgDb } from "@/lib/org/db";
import { audit } from "@/lib/org/audit";
import { back } from "@/lib/shared/flash";

export const metadata = { title: "Notice" };

async function save(formData: FormData) {
  "use server";
  const user = await requireOrgUser({ roles: ["program_lead"], skipNotice: true });
  const reads = String(formData.get("reads") ?? "").trim();
  const neverReads = String(formData.get("neverReads") ?? "").trim();
  const publish = formData.get("intent") === "publish";
  if (!reads || !neverReads) back("/org/lead/notice", "Both lists need at least one line.", "err");
  const last = await orgDb.notice.findFirst({ orderBy: { version: "desc" } });
  const draft = await draftNotice();
  const n = draft
    ? await orgDb.notice.update({ where: { id: draft.id }, data: { reads, neverReads } })
    : await orgDb.notice.create({ data: { version: (last?.version ?? 0) + 1, reads, neverReads } });
  if (publish) {
    await orgDb.notice.update({ where: { id: n.id }, data: { publishedAt: new Date(), publishedById: user.id } });
    await audit({ actorUserId: user.id, action: "notice.published", entityType: "Notice", entityId: n.id, meta: { version: n.version } });
    back("/org/lead/notice", `Version ${n.version} is published. Everyone will be asked to acknowledge it before taking a survey or appearing in any report.`);
  }
  await audit({ actorUserId: user.id, action: "notice.draft_saved", entityType: "Notice", entityId: n.id, meta: { version: n.version } });
  back("/org/lead/notice", "Draft saved. It is not published yet.");
}

export default async function NoticeEditor({ searchParams }: { searchParams: Promise<{ msg?: string; err?: string }> }) {
  await requireOrgUser({ roles: ["program_lead"], skipNotice: true });
  const sp = await searchParams;
  const [current, draft] = await Promise.all([currentNotice(), draftNotice()]);
  const base = draft ?? current ?? DEFAULT_NOTICE;
  return (
    <Page
      title="The Notice"
      back={{ href: "/org/lead", label: "Program lead console" }}
      intro="Say what the system sees before it sees anything. Analysis cannot be activated until a Notice is published. Write it in plain language, one item per line."
    >
      <Flash message={sp.msg} />
      <Flash message={sp.err} tone="danger" />
      {current ? (
        <p className="text-muted">Version {current.version} published {fmtDate(current.publishedAt)}. Publishing a new version asks everyone to acknowledge again.</p>
      ) : (
        <Card tone="warn">No Notice is published. Nothing runs until you publish one.</Card>
      )}
      <form action={save} className="space-y-5">
        <Field id="reads" label="It reads" hint="One item per line.">
          <Textarea id="reads" name="reads" rows={6} defaultValue={base.reads} required />
        </Field>
        <Field id="neverReads" label="It never reads, and never does" hint="One item per line.">
          <Textarea id="neverReads" name="neverReads" rows={8} defaultValue={base.neverReads} required />
        </Field>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" name="intent" value="publish">Publish this Notice</Button>
          <Button type="submit" name="intent" value="draft" variant="secondary">Save as draft</Button>
        </div>
      </form>
    </Page>
  );
}
