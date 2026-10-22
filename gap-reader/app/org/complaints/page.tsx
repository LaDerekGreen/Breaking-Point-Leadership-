import { Page, Card, Button, Field, Textarea, Flash, fmtDate } from "@/components/ui";
import { requireOrgUser } from "@/lib/org/session";
import { filerComplaints, filerRespond, type ComparisonSnapshot } from "@/lib/org/complaints";
import { getSettings } from "@/lib/org/settings";
import { GATE_MESSAGE } from "@/lib/ai/prompts";
import { back } from "@/lib/shared/flash";

export const metadata = { title: "Complaints you filed" };
const PATH = "/org/complaints";

async function respond(formData: FormData) {
  "use server";
  const user = await requireOrgUser();
  if (!user.personId) back(PATH, "Your account is not linked to the directory.", "err");
  const action = formData.get("action") === "withdraw" ? "withdraw" : "context";
  await filerRespond(String(formData.get("complaintId")), user.personId!, user.id, action, String(formData.get("text") ?? ""));
  back(PATH, action === "withdraw" ? "Withdrawn." : "Your context is saved.");
}

export default async function Complaints({ searchParams }: { searchParams: Promise<{ msg?: string; err?: string }> }) {
  const user = await requireOrgUser();
  const sp = await searchParams;
  const [list, settings] = await Promise.all([user.personId ? filerComplaints(user.personId) : [], getSettings()]);
  return (
    <Page title="Complaints you filed" intro="A formal performance complaint is placed beside the documented record and shown to you, privately, first. You can add context or withdraw it. Nothing enters anyone's record automatically.">
      <Flash message={sp.msg} />
      <Flash message={sp.err} tone="danger" />
      {list.length === 0 && <Card>You have no complaints on file.</Card>}
      {list.map((c) => {
        if (c.excluded)
          return (
            <Card key={c.id} tone="warn" title={`Concern filed ${fmtDate(c.filedAt)}`}>
              <p>{GATE_MESSAGE}</p>
              <p className="mt-2">It was not checked against you or anyone else. Please use your organization&apos;s own channels:</p>
              <p className="mt-2 whitespace-pre-line">{settings.reportingChannels || "Ask your program lead for your organization's reporting channels."}</p>
            </Card>
          );
        const s = c.comparison?.snapshot as ComparisonSnapshot | undefined;
        return (
          <Card key={c.id} title={`Complaint filed ${fmtDate(c.filedAt)}`}>
            <p className="whitespace-pre-line">{c.text}</p>
            {s && (
              <div className="mt-4 rounded-md border border-line p-3 text-sm">
                <p className="font-medium">Beside the documented record for this leader&apos;s team, the year before {s.asOf}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>{s.decisions.total} documented decisions; {s.decisions.withDocumentedReason} with a recorded reason, {s.decisions.withAlternatives} with alternatives considered.</li>
                  <li>{s.evaluations.count} evaluations{s.evaluations.averageRating !== null ? `, average rating ${s.evaluations.averageRating}` : ""}.</li>
                  <li>{s.stretch.count} stretch assignments.</li>
                  <li>
                    {!s.surveys ? "No survey cycle has closed." : "suppressed" in s.surveys ? `Survey (${s.surveys.cycle}): too few answers to show without risking anyone's anonymity.` : `Survey (${s.surveys.cycle}, ${s.surveys.n} people): ${s.surveys.averages.map((a) => a.average.toFixed(1)).join(", ")} on the eight statements.`}
                  </li>
                  <li className="text-muted">Not part of what the Gap Reader reads: {s.notAvailable.join(", ").toLowerCase()}.</li>
                </ul>
              </div>
            )}
            {c.comparison?.withdrawnAt ? (
              <p className="mt-3 font-medium">You withdrew this complaint on {fmtDate(c.comparison.withdrawnAt)}.</p>
            ) : (
              <div className="mt-4 space-y-3">
                <form action={respond} className="space-y-2">
                  <input type="hidden" name="complaintId" value={c.id} />
                  <input type="hidden" name="action" value="context" />
                  <Field id={`t-${c.id}`} label="Context the record is missing"><Textarea id={`t-${c.id}`} name="text" defaultValue={c.comparison?.filerContext ?? ""} /></Field>
                  <Button type="submit">Save context</Button>
                </form>
                <form action={respond}>
                  <input type="hidden" name="complaintId" value={c.id} />
                  <input type="hidden" name="action" value="withdraw" />
                  <Button type="submit" variant="danger">Withdraw this complaint</Button>
                </form>
              </div>
            )}
          </Card>
        );
      })}
    </Page>
  );
}
