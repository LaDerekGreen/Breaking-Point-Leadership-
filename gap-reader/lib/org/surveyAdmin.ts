import "server-only";
import { orgDb } from "./db";
import { audit } from "./audit";
import { hasAcknowledgedCurrent } from "./notice";
import { validAnswers } from "./survey";
import { reportingLine } from "./reviewers";
import type { OrgUser } from "./session";

export async function createCycle(name: string, actorUserId: string) {
  const last = await orgDb.surveyCycle.findFirst({ orderBy: { number: "desc" } });
  const c = await orgDb.surveyCycle.create({ data: { name: name.trim() || `Cycle ${(last?.number ?? 0) + 1}`, number: (last?.number ?? 0) + 1 } });
  await audit({ actorUserId, action: "survey.cycle_created", entityType: "SurveyCycle", entityId: c.id });
  return c;
}

/** Above (two levels of managers), beside (same manager), below (everyone who reports up to the leader). */
export async function inviteCircle(cycleId: string, leaderPersonId: string, actorUserId: string): Promise<number> {
  const leader = await orgDb.person.findUniqueOrThrow({ where: { id: leaderPersonId } });
  const line = await reportingLine(leaderPersonId);
  const above = [...line.above].slice(0, 2);
  const peers = leader.managerId ? (await orgDb.person.findMany({ where: { managerId: leader.managerId, id: { not: leaderPersonId } } })).map((p) => p.id) : [];
  const ids = [...new Set([...above, ...peers, ...line.below])];
  const users = await orgDb.user.findMany({ where: { personId: { in: ids } } });
  let n = 0;
  for (const u of users) {
    await orgDb.surveyInvitation.upsert({
      where: { cycleId_leaderId_userId: { cycleId, leaderId: leaderPersonId, userId: u.id } },
      create: { cycleId, leaderId: leaderPersonId, userId: u.id },
      update: {},
    });
    n++;
  }
  await audit({ actorUserId, action: "survey.invited", entityType: "SurveyCycle", entityId: cycleId, meta: { leaderPersonId, invitations: n } });
  return n;
}

export async function setCycleStatus(cycleId: string, status: "open" | "closed", actorUserId: string) {
  const c = await orgDb.surveyCycle.findUniqueOrThrow({ where: { id: cycleId } });
  if (status === "open" && c.status !== "draft") throw new Error("Only a draft cycle can be opened.");
  if (status === "closed" && c.status !== "open") throw new Error("Only an open cycle can be closed.");
  await orgDb.surveyCycle.update({ where: { id: cycleId }, data: status === "open" ? { status, openedAt: new Date() } : { status, closedAt: new Date() } });
  await audit({ actorUserId, action: `survey.cycle_${status}`, entityType: "SurveyCycle", entityId: cycleId });
}

export type ResponseInput = { vantage: "above" | "beside" | "below"; jobLevel?: string; answers: number[]; comments: string[]; openAnswer?: string };

/**
 * Records that the invitation was answered, and stores the answers with no
 * link to the person: no user ID, no timestamp, a random ID.
 */
export async function submitResponse(invitationId: string, user: OrgUser, input: ResponseInput) {
  if (!(await hasAcknowledgedCurrent(user.id))) throw new Error("Read the Notice before taking a survey.");
  if (!validAnswers(input.answers)) throw new Error("Answer all eight statements.");
  if (!["above", "beside", "below"].includes(input.vantage)) throw new Error("Choose your vantage point.");
  await orgDb.$transaction(async (tx) => {
    const inv = await tx.surveyInvitation.findUnique({ where: { id: invitationId }, include: { cycle: true } });
    if (!inv || inv.userId !== user.id) throw new Error("This survey is not yours.");
    if (inv.cycle.status !== "open") throw new Error("This survey is closed.");
    const done = await tx.surveyInvitation.updateMany({ where: { id: invitationId, completed: false }, data: { completed: true } });
    if (done.count !== 1) throw new Error("You have already answered this survey.");
    await tx.surveyResponse.create({
      data: {
        cycleId: inv.cycleId,
        leaderId: inv.leaderId,
        vantage: input.vantage,
        jobLevel: input.jobLevel?.trim() || null,
        answers: input.answers,
        comments: input.comments.map((c) => c.trim().slice(0, 2000)),
        openAnswer: input.openAnswer?.trim().slice(0, 4000) || null,
      },
    });
  });
  // Deliberately not audited: a timestamped entry next to an anonymous
  // response could be used to link the two.
}

export async function submitSelfRating(cycleId: string, user: OrgUser, answers: number[]) {
  if (!user.personId || !user.roles.includes("leader")) throw new Error("Only a leader rates themselves.");
  if (!validAnswers(answers)) throw new Error("Answer all eight statements.");
  const c = await orgDb.surveyCycle.findUniqueOrThrow({ where: { id: cycleId } });
  if (c.status !== "open") throw new Error("This cycle is not open.");
  await orgDb.leaderSelfRating.upsert({
    where: { cycleId_leaderId: { cycleId, leaderId: user.personId } },
    create: { cycleId, leaderId: user.personId, answers },
    update: { answers },
  });
  await audit({ actorUserId: user.id, action: "survey.self_rated", entityType: "SurveyCycle", entityId: cycleId });
}
