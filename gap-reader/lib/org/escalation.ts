/**
 * The Five Steps of Escalation (A6), as an explicit state machine.
 *
 *   1. PRIVATE_SURFACING   the leader alone sees the finding
 *   2. CORRECTION_WINDOW   ninety days or longer to contest, add context, plan
 *   3. DOCUMENTED_RECORD   only if the pattern persists, and a human confirms
 *   4. SENIOR_REVIEW       an experienced leader with no reporting stake judges
 *   5. BOARD_REVIEW        board and outside review, framed as fiduciary risk
 *
 * plus RESOLVED, which a human may reach from any step. No step can be
 * skipped. The system may only propose. The AI is not an actor at all: an
 * actor is either a named human or the deterministic system, and the system
 * can do nothing but propose.
 */

import type { Role } from "./roles";

export const STEPS = [
  "PRIVATE_SURFACING",
  "CORRECTION_WINDOW",
  "DOCUMENTED_RECORD",
  "SENIOR_REVIEW",
  "BOARD_REVIEW",
] as const;

export type Step = (typeof STEPS)[number];
export type State = Step | "RESOLVED";

export const STEP_NAMES: Record<State, string> = {
  PRIVATE_SURFACING: "Private Surfacing",
  CORRECTION_WINDOW: "Private Correction Window",
  DOCUMENTED_RECORD: "Documented Record",
  SENIOR_REVIEW: "Senior Human Review",
  BOARD_REVIEW: "Board and Outside Review",
  RESOLVED: "Resolved",
};

export const CORRECTION_WINDOW_FLOOR_DAYS = 90;

export function effectiveWindowDays(configured?: number | null): number {
  if (configured == null || !Number.isFinite(configured)) return CORRECTION_WINDOW_FLOOR_DAYS;
  return Math.max(CORRECTION_WINDOW_FLOOR_DAYS, Math.floor(configured));
}

export function validateWindowChange(requested: number): string | null {
  if (!Number.isInteger(requested)) return "The correction window must be a whole number of days.";
  if (requested < CORRECTION_WINDOW_FLOOR_DAYS)
    return `The correction window can be lengthened but never set below ${CORRECTION_WINDOW_FLOOR_DAYS} days.`;
  return null;
}

export type Actor =
  | { kind: "system" }
  | { kind: "human"; userId: string; roles: readonly Role[] };

export type FindingSnapshot = {
  state: State;
  leaderUserId: string | null;
  windowEndsAt: Date | null;
  contested: boolean;
  contestReadAt: Date | null;
  proposal: "advance" | "resolve" | null;
  seniorReviewerUserId: string | null;
  hasSeniorJudgment: boolean;
  hasBoardJudgment: boolean;
  /** Set by the next cycle's deterministic metrics, never by the AI. */
  patternPersists: boolean | null;
  leaderIsChiefExecutive: boolean;
};

export type EscalationEvent =
  | { type: "LEADER_OPENED"; at: Date; windowDays: number }
  | { type: "PROPOSE_ADVANCE"; at: Date }
  | { type: "PROPOSE_RESOLVE"; at: Date }
  | { type: "MARK_CONTEST_READ"; at: Date }
  | { type: "CONFIRM_RECORD"; at: Date; reason: string }
  | { type: "BEGIN_SENIOR_REVIEW"; at: Date; reason: string }
  | { type: "BEGIN_BOARD_REVIEW"; at: Date; reason: string }
  | { type: "RESOLVE"; at: Date; reason: string };

export type Patch = Partial<{
  state: State;
  firstOpenedAt: Date;
  windowEndsAt: Date;
  proposal: "advance" | "resolve" | null;
  proposalAt: Date | null;
  contestReadAt: Date;
  contestReadById: string;
  resolvedFromState: Step;
}>;

export type TransitionResult = { ok: true; patch: Patch; from: State; to: State } | { ok: false; error: string };

const DAY = 24 * 60 * 60 * 1000;

function fail(error: string): TransitionResult {
  return { ok: false, error };
}

function isHuman(a: Actor): a is Extract<Actor, { kind: "human" }> {
  return a.kind === "human" && typeof a.userId === "string" && a.userId.length > 0;
}

function has(a: Actor, role: Role): boolean {
  return isHuman(a) && a.roles.includes(role);
}

export function nextStep(state: State): Step | null {
  if (state === "RESOLVED") return null;
  const i = STEPS.indexOf(state);
  return i >= 0 && i < STEPS.length - 1 ? STEPS[i + 1] : null;
}

/** A contested finding cannot advance without a human reading the contest. */
function contestBlocks(f: FindingSnapshot): boolean {
  return f.contested && !f.contestReadAt;
}

function windowOver(f: FindingSnapshot, at: Date): boolean {
  return !!f.windowEndsAt && at.getTime() >= f.windowEndsAt.getTime();
}

function advance(f: FindingSnapshot, to: Step, extra: Patch = {}): TransitionResult {
  // The single place a state moves forward. It may move one step only.
  if (nextStep(f.state) !== to) return fail(`A finding cannot move from ${STEP_NAMES[f.state]} to ${STEP_NAMES[to]}. No step can be skipped.`);
  return { ok: true, patch: { ...extra, state: to, proposal: null, proposalAt: null }, from: f.state, to };
}

export function transition(f: FindingSnapshot, event: EscalationEvent, actor: Actor): TransitionResult {
  if (actor.kind !== "system" && actor.kind !== "human") return fail("Only a person or the system can act on a finding.");
  if (actor.kind === "human" && !isHuman(actor)) return fail("A human action needs a named person.");
  if (f.state === "RESOLVED") return fail("This finding is resolved.");

  // The system may propose and nothing else.
  const systemOnly = event.type === "PROPOSE_ADVANCE" || event.type === "PROPOSE_RESOLVE";
  if (actor.kind === "system" && !systemOnly) return fail("The system can only propose. A person must decide.");
  if (actor.kind === "human" && systemOnly) return fail("Proposals come from the next cycle's metrics.");

  switch (event.type) {
    case "LEADER_OPENED": {
      if (f.state !== "PRIVATE_SURFACING") return fail("The correction window has already started.");
      if (!isHuman(actor) || actor.userId !== f.leaderUserId) return fail("Only the leader who owns this finding can open it.");
      const days = effectiveWindowDays(event.windowDays);
      return advance(f, "CORRECTION_WINDOW", {
        firstOpenedAt: event.at,
        windowEndsAt: new Date(event.at.getTime() + days * DAY),
      });
    }

    case "PROPOSE_ADVANCE":
    case "PROPOSE_RESOLVE": {
      if (f.state !== "CORRECTION_WINDOW") return fail("Proposals are made only at the end of the correction window.");
      if (!windowOver(f, event.at)) return fail("The leader gets the full correction window.");
      if (f.patternPersists === null) return fail("The next cycle's metrics have not been measured yet.");
      if (event.type === "PROPOSE_ADVANCE" && !f.patternPersists) return fail("The pattern did not persist.");
      if (event.type === "PROPOSE_RESOLVE" && f.patternPersists) return fail("The pattern persisted.");
      return {
        ok: true,
        patch: { proposal: event.type === "PROPOSE_ADVANCE" ? "advance" : "resolve", proposalAt: event.at },
        from: f.state,
        to: f.state,
      };
    }

    case "MARK_CONTEST_READ": {
      if (!f.contested) return fail("This finding is not contested.");
      if (!has(actor, "program_lead") && !(f.seniorReviewerUserId && isHuman(actor) && actor.userId === f.seniorReviewerUserId) && !has(actor, "board_reviewer"))
        return fail("Only the program lead or a reviewer can record reading a contest.");
      if (isHuman(actor) && actor.userId === f.leaderUserId) return fail("The leader cannot read their own contest on anyone's behalf.");
      return { ok: true, patch: { contestReadAt: event.at, contestReadById: (actor as { userId: string }).userId }, from: f.state, to: f.state };
    }

    case "CONFIRM_RECORD": {
      if (!has(actor, "program_lead")) return fail("Only the program lead can confirm a finding into the record.");
      if (!event.reason.trim()) return fail("Write the reason for this decision.");
      if (f.state !== "CORRECTION_WINDOW") return fail("Only a finding in the correction window can enter the record.");
      if (!windowOver(f, event.at)) return fail("The leader gets the full correction window.");
      if (f.proposal !== "advance" || f.patternPersists !== true)
        return fail("A finding enters the record only when the next cycle shows the same pattern and the system has proposed it.");
      if (contestBlocks(f)) return fail("This finding is contested. A person must read the contest first.");
      return advance(f, "DOCUMENTED_RECORD");
    }

    case "BEGIN_SENIOR_REVIEW": {
      if (!has(actor, "program_lead")) return fail("Only the program lead can open Senior Human Review.");
      if (!event.reason.trim()) return fail("Write the reason for this decision.");
      if (f.state !== "DOCUMENTED_RECORD") return fail("Senior Human Review follows the Documented Record.");
      if (!f.seniorReviewerUserId) return fail("Assign a senior reviewer with no reporting stake first.");
      if (contestBlocks(f)) return fail("This finding is contested. A person must read the contest first.");
      return advance(f, "SENIOR_REVIEW");
    }

    case "BEGIN_BOARD_REVIEW": {
      if (!has(actor, "program_lead")) return fail("Only the program lead can open Board and Outside Review.");
      if (!event.reason.trim()) return fail("Write the reason for this decision.");
      if (f.state !== "SENIOR_REVIEW") return fail("Board and Outside Review follows Senior Human Review.");
      if (!f.hasSeniorJudgment) return fail("The senior reviewer has not written a judgment yet.");
      if (!f.leaderIsChiefExecutive && f.patternPersists !== true)
        return fail("Board review applies only if the pattern persists through senior review.");
      if (contestBlocks(f)) return fail("This finding is contested. A person must read the contest first.");
      return advance(f, "BOARD_REVIEW");
    }

    case "RESOLVE": {
      if (!event.reason.trim()) return fail("Write the reason for this decision.");
      if (!isHuman(actor)) return fail("A person must resolve a finding.");
      if (actor.userId === f.leaderUserId) return fail("The leader cannot resolve their own finding.");
      const ok =
        (f.state === "CORRECTION_WINDOW" && has(actor, "program_lead") && windowOver(f, event.at)) ||
        (f.state === "DOCUMENTED_RECORD" && has(actor, "program_lead")) ||
        (f.state === "SENIOR_REVIEW" && f.hasSeniorJudgment && (actor.userId === f.seniorReviewerUserId || has(actor, "program_lead"))) ||
        (f.state === "BOARD_REVIEW" && f.hasBoardJudgment && has(actor, "board_reviewer"));
      if (!ok) {
        if (f.state === "PRIVATE_SURFACING") return fail("The leader has not seen this finding yet.");
        if (f.state === "CORRECTION_WINDOW" && !windowOver(f, event.at)) return fail("The leader gets the full correction window.");
        return fail("You cannot resolve this finding at this step.");
      }
      return { ok: true, patch: { state: "RESOLVED", resolvedFromState: f.state, proposal: null, proposalAt: null }, from: f.state, to: "RESOLVED" };
    }
  }
}

// ---------------------------------------------------------------------------
// Who can see a finding. The single source of truth for both authorization
// and the "what has been shared and with whom" panel the leader sees.
// ---------------------------------------------------------------------------

export type Audience = "leader" | "program_lead" | "senior_reviewer" | "board_reviewers";

export type VisibilityInput = {
  state: State;
  resolvedFromState: Step | null;
  contested: boolean;
  proposal: "advance" | "resolve" | null;
};

export function stageIndex(v: VisibilityInput): number {
  const s = v.state === "RESOLVED" ? v.resolvedFromState ?? "PRIVATE_SURFACING" : v.state;
  return STEPS.indexOf(s);
}

export function audiences(v: VisibilityInput): Audience[] {
  const i = stageIndex(v);
  const out: Audience[] = ["leader"];
  const readingContest = v.state === "CORRECTION_WINDOW" && v.contested && v.proposal === "advance";
  if (i >= STEPS.indexOf("DOCUMENTED_RECORD") || readingContest) out.push("program_lead");
  if (i >= STEPS.indexOf("SENIOR_REVIEW")) out.push("senior_reviewer");
  if (i >= STEPS.indexOf("BOARD_REVIEW")) out.push("board_reviewers");
  return out;
}
