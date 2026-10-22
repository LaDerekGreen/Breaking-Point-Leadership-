import { Page, Card, Button, Field, Input, Select, Flash, fmtDate } from "@/components/ui";
import { requireOrgUser } from "@/lib/org/session";
import { orgDb } from "@/lib/org/db";
import { back } from "@/lib/shared/flash";
import { createCycle, inviteCircle, setCycleStatus } from "@/lib/org/surveyAdmin";
import { currentNotice } from "@/lib/org/notice";
import { getSettings } from "@/lib/org/settings";

export const metadata = { title: "Survey cycles" };
const PATH = "/org/lead/surveys";

async function create(formData: FormData) {
  "use server";
  const user = await requireOrgUser({ roles: ["program_lead"], skipNotice: true });
  if (!(await currentNotice())) back(PATH, "Publish the Notice before running a survey.", "err");
  await createCycle(String(formData.get("name") ?? ""), user.id);
  back(PATH, "Cycle created as a draft. Invite each leader's circle, then open it.");
}

async function invite(formData: FormData) {
  "use server";
  const user = await requireOrgUser({ roles: ["program_lead"], skipNotice: true });
  const cycleId = String(formData.get("cycleId"));
  const leader = String(formData.get("leader"));
  const leaders = leader === "all"
    ? await orgDb.person.findMany({ where: { user: { roles: { has: "leader" } } } })
    : await orgDb.person.findMany({ where: { id: leader } });
  let n = 0;
  for (const l of leaders) n += await inviteCircle(cycleId, l.id, user.id);
  back(PATH, `${n} invitations across ${leaders.length} leader${leaders.length === 1 ? "" : "s"}.`);
}

async function status(formData: FormData) {
  "use server";
  const user = await requireOrgUser({ roles: ["program_lead"], skipNotice: true });
  try {
    await setCycleStatus(String(formData.get("cycleId")), formData.get("to") === "open" ? "open" : "closed", user.id);
  } catch (e) {
    back(PATH, (e as Error).message, "err");
  }
  back(PATH, formData.get("to") === "open" ? "The cycle is open." : "The cycle is closed. Leaders can now see their results, combined under the anonymity threshold.");
}

export default async function Surveys({ searchParams }: { searchParams: Promise<{ msg?: string; err?: string }> }) {
  await requireOrgUser({ roles: ["program_lead"], skipNotice: true });
  const sp = await searchParams;
  const [cycles, leaders, settings] = await Promise.all([
    orgDb.surveyCycle.findMany({ orderBy: { number: "desc" }, include: { _count: { select: { invitations: true, responses: true } } } }),
    orgDb.person.findMany({ where: { user: { roles: { has: "leader" } } }, orderBy: { displayName: "asc" } }),
    getSettings(),
  ]);
  return (
    <Page
      title="Three Vantage Point Survey"
      back={{ href: "/org/lead", label: "Program lead console" }}
      intro={`Anonymous. No names are collected. Respondents choose their own vantage point. No result is shown for any group smaller than ${settings.anonymityThreshold}; smaller groups are combined with the next larger group first.`}
    >
      <Flash message={sp.msg} />
      <Flash message={sp.err} tone="danger" />
      <form action={create} className="flex flex-wrap items-end gap-3">
        <Field id="name" label="New cycle name"><Input id="name" name="name" placeholder="Spring 2027" /></Field>
        <Button type="submit">Create cycle</Button>
      </form>
      {cycles.map((c) => (
        <Card key={c.id} title={`${c.name} (cycle ${c.number})`}>
          <p className="text-sm text-muted">
            Status: {c.status}{c.openedAt ? `, opened ${fmtDate(c.openedAt)}` : ""}{c.closedAt ? `, closed ${fmtDate(c.closedAt)}` : ""}. {c._count.invitations} invited, {c._count.responses} answered.
          </p>
          {c.status !== "closed" && (
            <form action={invite} className="mt-3 flex flex-wrap items-end gap-3">
              <input type="hidden" name="cycleId" value={c.id} />
              <Field id={`leader-${c.id}`} label="Invite the circle of">
                <Select id={`leader-${c.id}`} name="leader">
                  <option value="all">Every leader</option>
                  {leaders.map((l) => <option key={l.id} value={l.id}>{l.displayName}</option>)}
                </Select>
              </Field>
              <Button type="submit" variant="secondary">Invite</Button>
            </form>
          )}
          <form action={status} className="mt-3">
            <input type="hidden" name="cycleId" value={c.id} />
            {c.status === "draft" && <Button type="submit" name="to" value="open">Open this cycle</Button>}
            {c.status === "open" && <Button type="submit" name="to" value="closed">Close this cycle</Button>}
          </form>
        </Card>
      ))}
    </Page>
  );
}
