import "server-only";
import { orgDb } from "./db";
import { audit } from "./audit";

/** All managers above a person, and everyone below them. These people have a reporting stake. */
export async function reportingLine(personId: string): Promise<{ above: Set<string>; below: Set<string> }> {
  const people = await orgDb.person.findMany({ select: { id: true, managerId: true } });
  const byId = new Map(people.map((p) => [p.id, p]));
  const above = new Set<string>();
  let cur = byId.get(personId)?.managerId ?? null;
  while (cur && !above.has(cur)) {
    above.add(cur);
    cur = byId.get(cur)?.managerId ?? null;
  }
  const below = new Set<string>();
  const queue = [personId];
  while (queue.length) {
    const id = queue.shift()!;
    for (const p of people) if (p.managerId === id && !below.has(p.id)) { below.add(p.id); queue.push(p.id); }
  }
  return { above, below };
}

/**
 * A designated more experienced leader, with no reporting stake in the
 * outcome. For the chief executive, who has no one above them, the reviewer
 * must be a board reviewer.
 */
export async function assignSeniorReviewer(leaderPersonId: string, reviewerUserId: string, actorUserId: string, reason: string) {
  const [leader, reviewer] = await Promise.all([
    orgDb.person.findUniqueOrThrow({ where: { id: leaderPersonId } }),
    orgDb.user.findUniqueOrThrow({ where: { id: reviewerUserId } }),
  ]);
  if (leader.isChiefExecutive) {
    if (!reviewer.roles.includes("board_reviewer")) throw new Error("The chief executive's reviewer must be a board reviewer.");
  } else if (!reviewer.roles.includes("senior_reviewer")) throw new Error("Choose someone with the senior reviewer role.");
  if (reviewer.personId === leaderPersonId) throw new Error("A leader cannot review themselves.");
  if (reviewer.personId) {
    const line = await reportingLine(leaderPersonId);
    if (line.above.has(reviewer.personId)) throw new Error("This person is in the leader's reporting line and has a stake in the outcome.");
    if (line.below.has(reviewer.personId)) throw new Error("This person reports to the leader and has a stake in the outcome.");
  }
  await orgDb.$transaction(async (tx) => {
    await tx.reviewerAssignment.upsert({
      where: { leaderPersonId },
      create: { leaderPersonId, seniorReviewerUserId: reviewerUserId, assignedById: actorUserId },
      update: { seniorReviewerUserId: reviewerUserId, assignedById: actorUserId },
    });
    await audit({ actorUserId, action: "reviewer.assigned", entityType: "Person", entityId: leaderPersonId, reason, meta: { reviewerUserId } }, tx);
  });
}
