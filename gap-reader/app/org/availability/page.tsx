import { Page, Card, Button, Field, Select, Flash, fmtDate } from "@/components/ui";
import { requireOrgUser } from "@/lib/org/session";
import { orgDb } from "@/lib/org/db";
import { back } from "@/lib/shared/flash";

export const metadata = { title: "Timing" };
const PATH = "/org/availability";
const DAY = 86400000;

async function set(formData: FormData) {
  "use server";
  const user = await requireOrgUser();
  const me = user.personId ? await orgDb.person.findUnique({ where: { id: user.personId } }) : null;
  if (!me?.managerId) back(PATH, "No leader is linked to your directory entry.", "err");
  const days = Math.min(30, Math.max(1, Number(formData.get("days")) || 7));
  // The choice of words is not stored. Only the date to wait until.
  await orgDb.availabilityFlag.deleteMany({ where: { userId: user.id } });
  await orgDb.availabilityFlag.create({ data: { userId: user.id, leaderPersonId: me!.managerId!, waitUntil: new Date(Date.now() + days * DAY) } });
  back(PATH, "Done. Your leader sees only a suggestion to hold non urgent conversations until that date, with no reason attached.");
}

async function clear() {
  "use server";
  const user = await requireOrgUser();
  await orgDb.availabilityFlag.deleteMany({ where: { userId: user.id } });
  back(PATH, "Cleared.");
}

export default async function Availability({ searchParams }: { searchParams: Promise<{ msg?: string; err?: string }> }) {
  const user = await requireOrgUser();
  const sp = await searchParams;
  const flag = await orgDb.availabilityFlag.findFirst({ where: { userId: user.id, waitUntil: { gte: new Date() } } });
  return (
    <Page title="Timing" intro="Voluntary. If you are having a heavy week, or would rather wait on a conversation, you can let your leader know. They see only a timing suggestion. No reason is passed on or stored, and nothing is inferred about you.">
      <Flash message={sp.msg} />
      <Flash message={sp.err} tone="danger" />
      {flag && <Card tone="accent">Your leader currently sees: hold non urgent conversations until {fmtDate(flag.waitUntil)}.</Card>}
      <form action={set} className="space-y-4">
        <fieldset className="space-y-2">
          <legend className="font-medium">Which fits</legend>
          <label className="flex min-h-11 items-center gap-2"><input type="radio" name="kind" value="a" defaultChecked /> Heavy week</label>
          <label className="flex min-h-11 items-center gap-2"><input type="radio" name="kind" value="b" /> I would rather wait on this conversation</label>
          <p className="text-sm text-muted">Your choice here is not saved. Either way your leader sees the same timing suggestion.</p>
        </fieldset>
        <Field id="days" label="For how long">
          <Select id="days" name="days" defaultValue="7">
            <option value="3">Three days</option>
            <option value="7">One week</option>
            <option value="14">Two weeks</option>
            <option value="30">Thirty days</option>
          </Select>
        </Field>
        <Button type="submit">Let my leader know</Button>
      </form>
      {flag && <form action={clear}><Button type="submit" variant="secondary">Clear it</Button></form>}
    </Page>
  );
}
