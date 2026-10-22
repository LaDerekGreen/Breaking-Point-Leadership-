import "server-only";
import type { Prisma, PrismaClient } from "@/generated/org";
import { orgDb } from "./db";
import { audit } from "./audit";
import { audiences, transition, STEP_NAMES, type Audience, type EscalationEvent, type FindingSnapshot, type State } from "./escalation";
import { getSettings } from "./settings";
import type { OrgUser } from "./session";

type Tx = PrismaClient | Prisma.TransactionClient;

export async function snapshotOf(findingId: string, tx: Tx = orgDb): Promise<FindingSnapshot> {
  const f = await tx.finding.findUniqueOrThrow({ where: { id: findingId }, include: { judgments: true } });
  const leader = await tx.person.findUniqueOrThrow({ where: { id: f.leaderId }, include: { user: true } });
  const assignment = await tx.reviewerAssignment.findUnique({ where: { leaderPersonId: f.leaderId } });
  return {
    state: f.state as State,
    leaderUserId: leader.user?.id ?? null,
    windowEndsAt: f.windowEndsAt,
    contested: f.contested,
    contestReadAt: f.contestReadAt,
    proposal: f.proposal,
    seniorReviewerUserId: assignment?.seniorReviewerUserId ?? null,
    hasSeniorJudgment: f.judgments.some((j) => j.stage === "SENIOR_REVIEW"),
    hasBoardJudgment: f.judgments.some((j) => j.stage === "BOARD_REVIEW"),
    patternPersists: f.patternPersists,
    leaderIsChiefExecutive: leader.isChiefExecutive,
  };
}

/** Which audiences this user belongs to for this finding. */
export async function userAudiences(findingId: string, user: OrgUser, tx: Tx = orgDb): Promise<Audience[]> {
  const f = await tx.finding.findUniqueOrThrow({ where: { id: findingId } });
  const assignment = await tx.reviewerAssignment.findUnique({ where: { leaderPersonId: f.leaderId } });
  const mine: Audience[] = [];
  if (user.personId === f.leaderId) mine.push("leader");
  if (user.roles.includes("program_lead")) mine.push("program_lead");
  if (assignment?.seniorReviewerUserId === user.id) mine.push("senior_reviewer");
  if (user.roles.includes("board_reviewer")) mine.push("board_reviewers");
  return mine;
}

/**
 * The only way a page may load a finding's contents. Anyone not in the
 * finding's current audience gets null, including the program lead before
 * the Documented Record.
 */
export async function loadFindingFor(findingId: string, user: OrgUser) {
  const f = await orgDb.finding.findUnique({
    where: { id: findingId },
    include: { responses: { orderBy: { createdAt: "asc" } }, judgments: { orderBy: { createdAt: "asc" } } },
  });
  if (!f) return null;
  const allowed = audiences({ state: f.state as State, resolvedFromState: f.resolvedFromState as never, contested: f.contested, proposal: f.proposal });
  const mine = await userAudiences(findingId, user);
  const as = mine.find((a) => allowed.includes(a));
  if (!as) return null;
  await audit({ actorUserId: user.id, action: "finding.viewed", entityType: "Finding", entityId: f.id, meta: { as } });
  return { finding: f, as };
}

/** "What has been shared and with whom", for the leader, from the same rule that authorizes access. */
export async function sharingPanel(findingId: string) {
  const f = await orgDb.finding.findUniqueOrThrow({ where: { id: findingId } });
  const list = audiences({ state: f.state as State, resolvedFromState: f.resolvedFromState as never, contested: f.contested, proposal: f.proposal });
  const rows: { who: string; what: string }[] = [{ who: "You", what: "The report, the metrics, and everything you have written." }];
  if (list.includes("program_lead")) {
    const leads = await orgDb.user.findMany({ where: { roles: { has: "program_lead" } }, include: { person: true } });
    const names = leads.map((u) => u.person?.displayName ?? u.name ?? "Program lead").join(", ");
    rows.push({
      who: `Program lead (${names})`,
      what:
        f.state === "CORRECTION_WINDOW"
          ? "The report and your contest, so a person reads your contest before anything can advance."
          : "The report, the metrics, and your responses, as part of your Documented Record.",
    });
  } else {
    rows.push({ who: "Program lead", what: "Only that a report was delivered to you, its step, and its dates. Not its contents." });
  }
  if (list.includes("senior_reviewer")) {
    const a = await orgDb.reviewerAssignment.findUnique({ where: { leaderPersonId: f.leaderId } });
    const u = a ? await orgDb.user.findUnique({ where: { id: a.seniorReviewerUserId }, include: { person: true } }) : null;
    rows.push({ who: `Senior reviewer (${u?.person?.displayName ?? u?.name ?? "assigned"})`, what: "The same report you saw, and your responses." });
  }
  if (list.includes("board_reviewers")) {
    const board = await orgDb.user.findMany({ where: { roles: { has: "board_reviewer" } }, include: { person: true } });
    rows.push({ who: `Board reviewers (${board.map((u) => u.person?.displayName ?? u.name ?? "board").join(", ") || "none assigned"})`, what: "The same report, your responses, and the senior reviewer's judgment." });
  }
  if (!list.includes("senior_reviewer")) rows.push({ who: "Anyone above you", what: "Nothing. No one above you has been notified." });
  return { step: STEP_NAMES[f.state as State], rows };
}

export class FindingActionError extends Error {}

/** Apply one escalation event through the state machine, with an audit entry. */
export async function applyEvent(findingId: string, event: EscalationEvent, user: OrgUser): Promise<void> {
  await orgDb.$transaction(async (tx) => {
    const snap = await snapshotOf(findingId, tx);
    const r = transition(snap, event, { kind: "human", userId: user.id, roles: user.roles });
    if (!r.ok) throw new FindingActionError(r.error);
    const p = r.patch;
    await tx.finding.update({
      where: { id: findingId },
      data: {
        state: p.state,
        firstOpenedAt: p.firstOpenedAt,
        windowEndsAt: p.windowEndsAt,
        proposal: "proposal" in p ? p.proposal : undefined,
        proposalAt: "proposalAt" in p ? p.proposalAt : undefined,
        contestReadAt: p.contestReadAt,
        contestReadById: p.contestReadById,
        resolvedFromState: p.resolvedFromState,
      },
    });
    await audit(
      {
        actorUserId: user.id,
        action: `escalation.${event.type.toLowerCase()}`,
        entityType: "Finding",
        entityId: findingId,
        reason: "reason" in event ? event.reason : null,
        meta: { from: r.from, to: r.to },
      },
      tx,
    );
  });
}

/** The leader opens their finding. The correction window starts now, at full length. */
export async function leaderOpened(findingId: string, user: OrgUser): Promise<void> {
  const f = await orgDb.finding.findUnique({ where: { id: findingId } });
  if (!f || f.state !== "PRIVATE_SURFACING" || user.personId !== f.leaderId) return;
  const { correctionWindowDays } = await getSettings();
  await applyEvent(findingId, { type: "LEADER_OPENED", at: new Date(), windowDays: correctionWindowDays }, user);
}

/** Context, contest or plan. Stored as the leader's own and travels with the finding. */
export async function addLeaderResponse(findingId: string, user: OrgUser, kind: "context" | "contest" | "plan", text: string): Promise<void> {
  const clean = text.trim();
  if (!clean) throw new FindingActionError("Write something first.");
  await orgDb.$transaction(async (tx) => {
    const f = await tx.finding.findUniqueOrThrow({ where: { id: findingId } });
    if (user.personId !== f.leaderId) throw new FindingActionError("Only the leader who owns this finding can respond.");
    if (f.state === "RESOLVED") throw new FindingActionError("This finding is resolved.");
    await tx.leaderResponse.create({ data: { findingId, kind, text: clean.slice(0, 10000) } });
    if (kind === "contest") {
      // A new contest must be read again before anything advances.
      await tx.finding.update({ where: { id: findingId }, data: { contested: true, contestReadAt: null, contestReadById: null } });
    }
    await audit({ actorUserId: user.id, action: `leader.${kind}`, entityType: "Finding", entityId: findingId, meta: { state: f.state } }, tx);
  });
}

/** An independent human judgment. The AI produces nothing at this step. */
export async function recordJudgment(findingId: string, user: OrgUser, text: string): Promise<void> {
  const clean = text.trim();
  if (!clean) throw new FindingActionError("Write your judgment first.");
  await orgDb.$transaction(async (tx) => {
    const f = await tx.finding.findUniqueOrThrow({ where: { id: findingId } });
    const a = await tx.reviewerAssignment.findUnique({ where: { leaderPersonId: f.leaderId } });
    let stage: "SENIOR_REVIEW" | "BOARD_REVIEW";
    if (f.state === "SENIOR_REVIEW" && a?.seniorReviewerUserId === user.id) stage = "SENIOR_REVIEW";
    else if (f.state === "BOARD_REVIEW" && user.roles.includes("board_reviewer")) stage = "BOARD_REVIEW";
    else throw new FindingActionError("You cannot write a judgment on this finding at this step.");
    if (user.personId === f.leaderId) throw new FindingActionError("A leader cannot review their own finding.");
    await tx.judgment.create({ data: { findingId, stage, reviewerUserId: user.id, text: clean.slice(0, 20000) } });
    await audit({ actorUserId: user.id, action: "review.judgment", entityType: "Finding", entityId: findingId, meta: { stage } }, tx);
  });
}

/** Delivery status only. This query never selects a report, metrics or response. */
export async function deliveryStatus() {
  const rows = await orgDb.finding.findMany({
    select: {
      id: true,
      leaderId: true,
      state: true,
      deliveredAt: true,
      firstOpenedAt: true,
      windowEndsAt: true,
      contested: true,
      contestReadAt: true,
      proposal: true,
      patternPersists: true,
      resolvedFromState: true,
    },
    orderBy: { deliveredAt: "desc" },
  });
  const people = await orgDb.person.findMany({ where: { id: { in: [...new Set(rows.map((r) => r.leaderId))] } } });
  const byId = new Map(people.map((p) => [p.id, p]));
  return rows.map((r) => ({ ...r, leader: byId.get(r.leaderId) ?? null }));
}
