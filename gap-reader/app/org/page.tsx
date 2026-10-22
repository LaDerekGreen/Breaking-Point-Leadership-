import Link from "next/link";
import { Page, Card } from "@/components/ui";
import { requireOrgUser } from "@/lib/org/session";
import { orgDb } from "@/lib/org/db";
import { ROLE_LABELS } from "@/lib/org/roles";

export const metadata = { title: "Home" };

export default async function OrgHome() {
  const user = await requireOrgUser();
  const [openInvites, myFindings, myComplaints, reviews, board] = await Promise.all([
    orgDb.surveyInvitation.count({ where: { userId: user.id, completed: false, cycle: { status: "open" } } }),
    user.personId ? orgDb.finding.count({ where: { leaderId: user.personId, state: { not: "RESOLVED" } } }) : 0,
    user.personId ? orgDb.complaint.count({ where: { filerPersonId: user.personId } }) : 0,
    orgDb.reviewerAssignment.findMany({ where: { seniorReviewerUserId: user.id }, select: { leaderPersonId: true } }).then((a) =>
      orgDb.finding.count({ where: { state: "SENIOR_REVIEW", leaderId: { in: a.map((x) => x.leaderPersonId) } } }),
    ),
    user.roles.includes("board_reviewer") ? orgDb.finding.count({ where: { state: "BOARD_REVIEW" } }) : 0,
  ]);
  return (
    <Page title="Welcome" intro={<>Signed in as {user.email}. Your roles: {user.roles.map((r) => ROLE_LABELS[r]).join(", ") || "none yet"}.</>}>
      {user.roles.includes("program_lead") && (
        <Card title="Program lead console">
          <p>The Notice, settings, data imports, survey cycles, delivery status, reviewers and the audit log.</p>
          <p><Link href="/org/lead">Open the console</Link></p>
        </Card>
      )}
      {user.roles.includes("leader") && (
        <Card title="Your reports" tone={myFindings ? "accent" : "plain"}>
          <p>{myFindings ? `You have ${myFindings} open finding${myFindings === 1 ? "" : "s"}. Each one is visible to you and to no one else until the steps say otherwise.` : "You have no open findings."}</p>
          <p><Link href="/org/leader">Open your reports and survey results</Link></p>
        </Card>
      )}
      <Card title="Surveys">
        <p>{openInvites ? `You have ${openInvites} survey${openInvites === 1 ? "" : "s"} to answer. Your answers are anonymous.` : "No surveys are waiting for you."}</p>
        <p><Link href="/org/survey">Go to surveys</Link></p>
      </Card>
      <Card title="Timing">
        <p>Having a heavy week, or would you rather wait on a conversation? You can let your leader know, with no reason attached.</p>
        <p><Link href="/org/availability">Set a timing preference</Link></p>
      </Card>
      {myComplaints > 0 && (
        <Card title="Complaints you filed">
          <p>See each complaint beside the documented record, add context, or withdraw it.</p>
          <p><Link href="/org/complaints">Open</Link></p>
        </Card>
      )}
      {user.roles.includes("senior_reviewer") && (
        <Card title="Senior Human Review"><p>{reviews} waiting for your independent judgment.</p><p><Link href="/org/review">Open</Link></p></Card>
      )}
      {user.roles.includes("board_reviewer") && (
        <Card title="Board and Outside Review"><p>{board} records in front of the board.</p><p><Link href="/org/board">Open</Link></p></Card>
      )}
    </Page>
  );
}
