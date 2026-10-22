import Link from "next/link";
import { Page, Card, Button } from "@/components/ui";
import { requireOrgUser } from "@/lib/org/session";
import { currentNotice } from "@/lib/org/notice";
import { getSettings } from "@/lib/org/settings";
import { FIRST_NINETY_DAYS } from "@/lib/org/checklist";
import { orgDb } from "@/lib/org/db";
import { audit } from "@/lib/org/audit";
import { revalidatePath } from "next/cache";

export const metadata = { title: "Program lead" };

async function toggle(formData: FormData) {
  "use server";
  const user = await requireOrgUser({ roles: ["program_lead"], skipNotice: true });
  const key = String(formData.get("key"));
  if (!FIRST_NINETY_DAYS.some((l) => l.key === key)) return;
  const s = await getSettings();
  const done = s.checklistDone.includes(key) ? s.checklistDone.filter((k) => k !== key) : [...s.checklistDone, key];
  await orgDb.orgSettings.update({ where: { id: 1 }, data: { checklistDone: done } });
  await audit({ actorUserId: user.id, action: "checklist.updated", entityType: "OrgSettings", meta: { key, done: done.includes(key) } });
  revalidatePath("/org/lead");
}

const SECTIONS = [
  { href: "/org/lead/notice", title: "Notice", text: "Publish and edit what the system reads and never reads." },
  { href: "/org/lead/settings", title: "Settings", text: "Anonymity threshold, correction window, reporting channels, AI provider." },
  { href: "/org/lead/people", title: "Directory", text: "People, roles and accounts. The only place names are kept." },
  { href: "/org/lead/import", title: "Import records", text: "Decisions, promotions, evaluations, stretch assignments, complaints." },
  { href: "/org/lead/surveys", title: "Survey cycles", text: "Run the Three Vantage Point Survey." },
  { href: "/org/lead/analysis", title: "Run analysis", text: "Compute patterns and deliver reports, privately, to each leader." },
  { href: "/org/lead/deliveries", title: "Delivery status", text: "Which reports were delivered and where each stands. Not their contents." },
  { href: "/org/lead/reviewers", title: "Reviewers", text: "Senior reviewers with no reporting stake, and board reviewers." },
  { href: "/org/lead/gate", title: "Outside the Gap Reader", text: "When the law or policy gate fired." },
  { href: "/org/lead/audit", title: "Audit log", text: "Every finding, delivery, step and decision. Export it." },
];

export default async function Lead() {
  await requireOrgUser({ roles: ["program_lead"], skipNotice: true });
  const [notice, settings] = await Promise.all([currentNotice(), getSettings()]);
  return (
    <Page title="Program lead console">
      {!notice ? (
        <Card tone="warn" title="Analysis is not active">
          <p>You cannot import data for analysis, run a survey or run any analysis until the Notice is published.</p>
          <p><Link href="/org/lead/notice">Publish the Notice</Link></p>
        </Card>
      ) : (
        <Card tone="accent">Notice version {notice.version} is published. Analysis can run.</Card>
      )}
      <Card title="The first ninety days">
        <ol className="space-y-4">
          {FIRST_NINETY_DAYS.map((l, i) => {
            const done = settings.checklistDone.includes(l.key);
            return (
              <li key={l.key} className="flex gap-3">
                <form action={toggle}>
                  <input type="hidden" name="key" value={l.key} />
                  <Button type="submit" variant="secondary" aria-pressed={done} aria-label={`${done ? "Mark not done" : "Mark done"}: ${l.text}`} className="min-w-11 px-2">
                    {done ? "✓" : i + 1}
                  </Button>
                </form>
                <div>
                  <p className={`font-medium ${done ? "line-through text-muted" : ""}`}>{l.text}</p>
                  <p className="text-sm text-muted">{l.how}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href} className="block rounded-lg border border-line bg-card p-4 no-underline hover:border-accent">
            <span className="font-semibold text-accent">{s.title}</span>
            <span className="mt-1 block text-sm text-muted">{s.text}</span>
          </Link>
        ))}
      </div>
    </Page>
  );
}
