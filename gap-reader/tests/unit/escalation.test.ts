import { describe, expect, it } from "vitest";
import {
  audiences,
  effectiveWindowDays,
  nextStep,
  STEPS,
  transition,
  validateWindowChange,
  type Actor,
  type FindingSnapshot,
} from "@/lib/org/escalation";

const DAY = 86400000;
const t0 = new Date("2026-01-01T00:00:00Z");
const leader: Actor = { kind: "human", userId: "u-leader", roles: ["leader"] };
const lead: Actor = { kind: "human", userId: "u-lead", roles: ["program_lead"] };
const senior: Actor = { kind: "human", userId: "u-senior", roles: ["senior_reviewer"] };
const board: Actor = { kind: "human", userId: "u-board", roles: ["board_reviewer"] };
const system: Actor = { kind: "system" };

const base = (over: Partial<FindingSnapshot> = {}): FindingSnapshot => ({
  state: "PRIVATE_SURFACING",
  leaderUserId: "u-leader",
  windowEndsAt: null,
  contested: false,
  contestReadAt: null,
  proposal: null,
  seniorReviewerUserId: "u-senior",
  hasSeniorJudgment: false,
  hasBoardJudgment: false,
  patternPersists: null,
  leaderIsChiefExecutive: false,
  ...over,
});

function apply(f: FindingSnapshot, r: ReturnType<typeof transition>): FindingSnapshot {
  if (!r.ok) throw new Error(r.error);
  const { firstOpenedAt: _a, contestReadById: _b, resolvedFromState: _c, proposalAt: _d, ...p } = r.patch;
  return { ...f, ...p } as FindingSnapshot;
}

const afterWindow = new Date(t0.getTime() + 91 * DAY);

describe("five steps of escalation", () => {
  it("has five steps in the book's order", () => {
    expect(STEPS).toEqual(["PRIVATE_SURFACING", "CORRECTION_WINDOW", "DOCUMENTED_RECORD", "SENIOR_REVIEW", "BOARD_REVIEW"]);
    expect(nextStep("PRIVATE_SURFACING")).toBe("CORRECTION_WINDOW");
    expect(nextStep("BOARD_REVIEW")).toBeNull();
  });

  it("window is ninety days or longer, never shorter", () => {
    expect(effectiveWindowDays(30)).toBe(90);
    expect(effectiveWindowDays(120)).toBe(120);
    expect(validateWindowChange(89)).toMatch(/never/);
    expect(validateWindowChange(180)).toBeNull();
  });

  it("walks all five steps in order with the right people", () => {
    let f = base();
    f = apply(f, transition(f, { type: "LEADER_OPENED", at: t0, windowDays: 90 }, leader));
    expect(f.state).toBe("CORRECTION_WINDOW");
    expect(f.windowEndsAt!.getTime()).toBe(t0.getTime() + 90 * DAY);
    f = { ...f, patternPersists: true };
    f = apply(f, transition(f, { type: "PROPOSE_ADVANCE", at: afterWindow }, system));
    expect(f.state).toBe("CORRECTION_WINDOW");
    expect(f.proposal).toBe("advance");
    f = apply(f, transition(f, { type: "CONFIRM_RECORD", at: afterWindow, reason: "Same pattern next cycle." }, lead));
    expect(f.state).toBe("DOCUMENTED_RECORD");
    f = apply(f, transition(f, { type: "BEGIN_SENIOR_REVIEW", at: afterWindow, reason: "Persisting." }, lead));
    expect(f.state).toBe("SENIOR_REVIEW");
    f = { ...f, hasSeniorJudgment: true };
    f = apply(f, transition(f, { type: "BEGIN_BOARD_REVIEW", at: afterWindow, reason: "Persisted through senior review." }, lead));
    expect(f.state).toBe("BOARD_REVIEW");
    f = { ...f, hasBoardJudgment: true };
    f = apply(f, transition(f, { type: "RESOLVE", at: afterWindow, reason: "Board decision recorded." }, board));
    expect(f.state).toBe("RESOLVED");
  });

  it("cannot skip any step", () => {
    const cases: [FindingSnapshot, Parameters<typeof transition>[1]][] = [
      [base(), { type: "CONFIRM_RECORD", at: afterWindow, reason: "x" }],
      [base(), { type: "BEGIN_SENIOR_REVIEW", at: afterWindow, reason: "x" }],
      [base(), { type: "BEGIN_BOARD_REVIEW", at: afterWindow, reason: "x" }],
      [base({ state: "CORRECTION_WINDOW", windowEndsAt: t0, proposal: "advance", patternPersists: true }), { type: "BEGIN_SENIOR_REVIEW", at: afterWindow, reason: "x" }],
      [base({ state: "CORRECTION_WINDOW", windowEndsAt: t0, proposal: "advance", patternPersists: true }), { type: "BEGIN_BOARD_REVIEW", at: afterWindow, reason: "x" }],
      [base({ state: "DOCUMENTED_RECORD", hasSeniorJudgment: true, patternPersists: true }), { type: "BEGIN_BOARD_REVIEW", at: afterWindow, reason: "x" }],
    ];
    for (const [f, e] of cases) expect(transition(f, e, lead).ok).toBe(false);
  });

  it("only the owning leader starts the window", () => {
    expect(transition(base(), { type: "LEADER_OPENED", at: t0, windowDays: 90 }, lead).ok).toBe(false);
    expect(transition(base(), { type: "LEADER_OPENED", at: t0, windowDays: 90 }, { kind: "human", userId: "someone", roles: ["leader"] }).ok).toBe(false);
  });

  it("gives the leader the full window", () => {
    const f = base({ state: "CORRECTION_WINDOW", windowEndsAt: new Date(t0.getTime() + 90 * DAY), patternPersists: true });
    expect(transition(f, { type: "PROPOSE_ADVANCE", at: new Date(t0.getTime() + 89 * DAY) }, system).ok).toBe(false);
    expect(transition({ ...f, proposal: "advance" }, { type: "CONFIRM_RECORD", at: new Date(t0.getTime() + 89 * DAY), reason: "x" }, lead).ok).toBe(false);
    expect(transition(f, { type: "RESOLVE", at: new Date(t0.getTime() + 89 * DAY), reason: "x" }, lead).ok).toBe(false);
  });

  it("the system can only propose, never decide", () => {
    const f = base({ state: "CORRECTION_WINDOW", windowEndsAt: t0, proposal: "advance", patternPersists: true });
    for (const e of [
      { type: "CONFIRM_RECORD", at: afterWindow, reason: "x" },
      { type: "BEGIN_SENIOR_REVIEW", at: afterWindow, reason: "x" },
      { type: "BEGIN_BOARD_REVIEW", at: afterWindow, reason: "x" },
      { type: "RESOLVE", at: afterWindow, reason: "x" },
      { type: "MARK_CONTEST_READ", at: afterWindow },
      { type: "LEADER_OPENED", at: afterWindow, windowDays: 90 },
    ] as const)
      expect(transition(f, e, system).ok).toBe(false);
  });

  it("an actor that is neither a person nor the system is refused", () => {
    const ai = { kind: "ai" } as unknown as Actor;
    const f = base({ state: "CORRECTION_WINDOW", windowEndsAt: t0, patternPersists: true });
    expect(transition(f, { type: "PROPOSE_ADVANCE", at: afterWindow }, ai).ok).toBe(false);
    expect(transition(f, { type: "RESOLVE", at: afterWindow, reason: "x" }, { kind: "human", userId: "", roles: ["program_lead"] }).ok).toBe(false);
  });

  it("enters the record only if the pattern persists and the system proposed it", () => {
    const f = base({ state: "CORRECTION_WINDOW", windowEndsAt: t0, patternPersists: false });
    expect(transition(f, { type: "PROPOSE_ADVANCE", at: afterWindow }, system).ok).toBe(false);
    expect(transition(f, { type: "CONFIRM_RECORD", at: afterWindow, reason: "x" }, lead).ok).toBe(false);
    const p = transition(f, { type: "PROPOSE_RESOLVE", at: afterWindow }, system);
    expect(p.ok && p.patch.proposal).toBe("resolve");
    expect(transition(base({ state: "CORRECTION_WINDOW", windowEndsAt: t0, patternPersists: null }), { type: "PROPOSE_ADVANCE", at: afterWindow }, system).ok).toBe(false);
    expect(transition({ ...f, patternPersists: true, proposal: null }, { type: "CONFIRM_RECORD", at: afterWindow, reason: "x" }, lead).ok).toBe(false);
  });

  it("only the program lead confirms, and always with a reason", () => {
    const f = base({ state: "CORRECTION_WINDOW", windowEndsAt: t0, proposal: "advance", patternPersists: true });
    expect(transition(f, { type: "CONFIRM_RECORD", at: afterWindow, reason: "x" }, senior).ok).toBe(false);
    expect(transition(f, { type: "CONFIRM_RECORD", at: afterWindow, reason: "x" }, leader).ok).toBe(false);
    expect(transition(f, { type: "CONFIRM_RECORD", at: afterWindow, reason: "  " }, lead).ok).toBe(false);
  });

  it("a contested finding cannot advance until a human reads the contest", () => {
    let f = base({ state: "CORRECTION_WINDOW", windowEndsAt: t0, proposal: "advance", patternPersists: true, contested: true });
    expect(transition(f, { type: "CONFIRM_RECORD", at: afterWindow, reason: "x" }, lead).ok).toBe(false);
    expect(transition(f, { type: "MARK_CONTEST_READ", at: afterWindow }, leader).ok).toBe(false);
    const read = transition(f, { type: "MARK_CONTEST_READ", at: afterWindow }, lead);
    expect(read.ok).toBe(true);
    f = { ...f, contestReadAt: afterWindow };
    expect(transition(f, { type: "CONFIRM_RECORD", at: afterWindow, reason: "x" }, lead).ok).toBe(true);
    const later = base({ state: "DOCUMENTED_RECORD", contested: true });
    expect(transition(later, { type: "BEGIN_SENIOR_REVIEW", at: afterWindow, reason: "x" }, lead).ok).toBe(false);
  });

  it("senior review needs an assigned reviewer, and board review needs their judgment", () => {
    expect(transition(base({ state: "DOCUMENTED_RECORD", seniorReviewerUserId: null }), { type: "BEGIN_SENIOR_REVIEW", at: afterWindow, reason: "x" }, lead).ok).toBe(false);
    expect(transition(base({ state: "SENIOR_REVIEW", patternPersists: true }), { type: "BEGIN_BOARD_REVIEW", at: afterWindow, reason: "x" }, lead).ok).toBe(false);
    expect(transition(base({ state: "SENIOR_REVIEW", hasSeniorJudgment: true, patternPersists: false }), { type: "BEGIN_BOARD_REVIEW", at: afterWindow, reason: "x" }, lead).ok).toBe(false);
  });

  it("the chief executive's record goes to the board after senior review", () => {
    const f = base({ state: "SENIOR_REVIEW", hasSeniorJudgment: true, patternPersists: null, leaderIsChiefExecutive: true });
    expect(transition(f, { type: "BEGIN_BOARD_REVIEW", at: afterWindow, reason: "No one above the chief executive." }, lead).ok).toBe(true);
  });

  it("the leader cannot resolve their own finding, and nothing moves once resolved", () => {
    const f = base({ state: "DOCUMENTED_RECORD" });
    expect(transition(f, { type: "RESOLVE", at: afterWindow, reason: "x" }, { kind: "human", userId: "u-leader", roles: ["program_lead"] }).ok).toBe(false);
    const done = base({ state: "RESOLVED" });
    expect(transition(done, { type: "BEGIN_SENIOR_REVIEW", at: afterWindow, reason: "x" }, lead).ok).toBe(false);
  });

  it("visibility widens one step at a time and starts with the leader alone", () => {
    const v = (state: FindingSnapshot["state"], extra = {}) => audiences({ state, resolvedFromState: null, contested: false, proposal: null, ...extra });
    expect(v("PRIVATE_SURFACING")).toEqual(["leader"]);
    expect(v("CORRECTION_WINDOW")).toEqual(["leader"]);
    expect(v("CORRECTION_WINDOW", { contested: true, proposal: "advance" })).toEqual(["leader", "program_lead"]);
    expect(v("DOCUMENTED_RECORD")).toEqual(["leader", "program_lead"]);
    expect(v("SENIOR_REVIEW")).toEqual(["leader", "program_lead", "senior_reviewer"]);
    expect(v("BOARD_REVIEW")).toEqual(["leader", "program_lead", "senior_reviewer", "board_reviewers"]);
    expect(v("RESOLVED", { resolvedFromState: "CORRECTION_WINDOW" })).toEqual(["leader"]);
  });
});
