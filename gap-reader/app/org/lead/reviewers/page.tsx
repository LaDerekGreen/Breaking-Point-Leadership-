import { Page, Card, Button, Field, Input, Select, Flash, Table } from "@/components/ui";
import { requireOrgUser } from "@/lib/org/session";
import { orgDb } from "@/lib/org/db";
import { assignSeniorReviewer } from "@/lib/org/reviewers";
import { back } from "@/lib/shared/flash";

export const metadata = { title: "Reviewers" };
const PATH = "/org/lead/reviewers";

async function assign(formData: FormData) {
  "use server";
  const user = await requireOrgUser({ roles: ["program_lead"], skipNotice: true });
  try {
    await assignSeniorReviewer(String(formData.get("leader")), String(formData.get("reviewer")), user.id, String(formData.get("reason") ?? ""));
  } catch (e) {
    back(PATH, (e as Error).message, "err");
  }
  back(PATH, "Reviewer assigned.");
}

export default async function Reviewers({ searchParams }: { searchParams: Promise<{ msg?: string; err?: string }> }) {
  await requireOrgUser({ roles: ["program_lead"], skipNotice: true });
  const sp = await searchParams;
  const [leaders, reviewers, board, assignments] = await Promise.all([
    orgDb.person.findMany({ where: { user: { roles: { has: "leader" } } }, orderBy: { displayName: "asc" } }),
    orgDb.user.findMany({ where: { roles: { hasSome: ["senior_reviewer", "board_reviewer"] } }, include: { person: true } }),
    orgDb.user.findMany({ where: { roles: { has: "board_reviewer" } }, include: { person: true } }),
    orgDb.reviewerAssignment.findMany(),
  ]);
  const name = (id: string) => reviewers.find((r) => r.id === id)?.person?.displayName ?? reviewers.find((r) => r.id === id)?.email ?? "";
  return (
    <Page
      title="Reviewers"
      back={{ href: "/org/lead", label: "Program lead console" }}
      intro="Senior Human Review needs a more experienced leader with no reporting stake in the outcome: no one in the leader's reporting line, above or below. The chief executive, who has no one above them, is reviewed by a board reviewer."
    >
      <Flash message={sp.msg} />
      <Flash message={sp.err} tone="danger" />
      <form action={assign} className="space-y-4">
        <Field id="leader" label="Leader">
          <Select id="leader" name="leader" required>
            {leaders.map((l) => <option key={l.id} value={l.id}>{l.displayName}{l.isChiefExecutive ? " (chief executive)" : ""}</option>)}
          </Select>
        </Field>
        <Field id="reviewer" label="Senior reviewer">
          <Select id="reviewer" name="reviewer" required>
            {reviewers.map((r) => <option key={r.id} value={r.id}>{r.person?.displayName ?? r.email}{r.roles.includes("board_reviewer") ? " (board)" : ""}</option>)}
          </Select>
        </Field>
        <Field id="reason" label="Why this person (for the audit log)"><Input id="reason" name="reason" required /></Field>
        <Button type="submit">Assign</Button>
      </form>
      <Table head={["Leader", "Senior reviewer"]} rows={leaders.map((l) => [l.displayName, name(assignments.find((a) => a.leaderPersonId === l.id)?.seniorReviewerUserId ?? "") || "Not assigned"])} caption="Assignments" />
      <Card title="Board reviewers">
        <p>{board.map((b) => b.person?.displayName ?? b.email).join(", ") || "None. Give someone the board reviewer role in the directory."}</p>
      </Card>
    </Page>
  );
}
