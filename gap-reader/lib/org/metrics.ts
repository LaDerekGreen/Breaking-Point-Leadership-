/**
 * Pattern metrics (A4). Computed in code, deterministically, never by the
 * model. The output contains anonymous IDs, roles, bands and numbers only:
 * no names and no free text that could identify a person.
 */

import { round2, type SurveyResult, type GapRow } from "./anonymity";

const DAY = 24 * 60 * 60 * 1000;

export type DecisionIn = {
  decidedAt: Date;
  requestedAt?: Date | null;
  outcome?: string | null;
  shift?: string | null;
  team?: string | null;
  tenureBand?: string | null;
  minutesBeforeOpinion?: number | null;
};

export type EvaluationIn = {
  subjectRef: string;
  evaluatedAt: Date;
  rating: number;
  commitmentType?: string | null;
  commitmentDue?: Date | null;
  surveyItem?: number | null;
};

export type PromotionIn = { subjectRef: string; approvalDate: Date; effectiveDate: Date };
export type StretchIn = { assignedAt: Date; tenureBand: string; resultRating?: number | null };
export type ComplaintIn = { id: string; filerRef: string; filedAt: Date };

export type CycleSurvey = { cycleNumber: number; result: SurveyResult };

export type LeaderData = {
  leaderAnonId: string;
  asOf: Date;
  decisions: DecisionIn[];
  evaluations: EvaluationIn[];
  promotions: PromotionIn[];
  stretch: StretchIn[];
  complaints: ComplaintIn[];
  /** Ordered oldest to newest. Only threshold-safe results. */
  surveys: CycleSurvey[];
};

export type Metrics = {
  leaderAnonId: string;
  asOf: string;
  timeBeforeOpinion: { n: number; medianMinutes: number; shareOpinionFirst: number } | null;
  recommendations: { n: number; dismissed: number; deferred: number; dismissedOrDeferredShare: number } | null;
  approvalLatency: {
    dimension: "shift" | "team" | "tenure band";
    groups: { label: string; n: number; medianDays: number }[];
    ratio: number;
  } | null;
  stretch: {
    n: number;
    bands: { band: string; n: number; share: number; averageResult: number | null }[];
  } | null;
  promotionCommitments: { n: number; kept: number; missed: number; pending: number } | null;
  /** Retaliation signal. Never becomes a finding: it fires the exclusion gate. */
  evaluationAfterConcern: { concerns: number; drops: number; complaintIds: string[] };
  cultureTrend: {
    items: { item: number; previous: number; current: number; change: number }[];
    cycles: [number, number];
  } | null;
  selfVsTeamGap: { cycleNumber: number; top: GapRow[]; aboveHighBelowLow: number } | null;
};

export function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function computeMetrics(d: LeaderData): Metrics {
  return {
    leaderAnonId: d.leaderAnonId,
    asOf: d.asOf.toISOString().slice(0, 10),
    timeBeforeOpinion: timeBeforeOpinion(d.decisions),
    recommendations: recommendations(d.decisions),
    approvalLatency: approvalLatency(d.decisions),
    stretch: stretch(d.stretch),
    promotionCommitments: promotionCommitments(d.evaluations, d.promotions, d.asOf),
    evaluationAfterConcern: evaluationAfterConcern(d.evaluations, d.complaints),
    cultureTrend: cultureTrend(d.evaluations, d.surveys),
    selfVsTeamGap: selfVsTeamGap(d.surveys),
  };
}

function timeBeforeOpinion(ds: DecisionIn[]): Metrics["timeBeforeOpinion"] {
  const xs = ds.map((x) => x.minutesBeforeOpinion).filter((x): x is number => typeof x === "number");
  if (xs.length === 0) return null;
  return {
    n: xs.length,
    medianMinutes: round2(median(xs)),
    shareOpinionFirst: round2(xs.filter((x) => x === 0).length / xs.length),
  };
}

function recommendations(ds: DecisionIn[]): Metrics["recommendations"] {
  const recs = ds.filter((x) => x.outcome === "accepted" || x.outcome === "dismissed" || x.outcome === "deferred");
  if (recs.length === 0) return null;
  const dismissed = recs.filter((x) => x.outcome === "dismissed").length;
  const deferred = recs.filter((x) => x.outcome === "deferred").length;
  return { n: recs.length, dismissed, deferred, dismissedOrDeferredShare: round2((dismissed + deferred) / recs.length) };
}

function approvalLatency(ds: DecisionIn[]): Metrics["approvalLatency"] {
  const timed = ds.filter((x) => x.requestedAt);
  let best: Metrics["approvalLatency"] = null;
  const dims: ["shift" | "team" | "tenure band", (x: DecisionIn) => string | null | undefined][] = [
    ["shift", (x) => x.shift],
    ["team", (x) => x.team],
    ["tenure band", (x) => x.tenureBand],
  ];
  for (const [dimension, key] of dims) {
    const map = new Map<string, number[]>();
    for (const x of timed) {
      const k = key(x)?.trim();
      if (!k) continue;
      const days = Math.max(0, (x.decidedAt.getTime() - (x.requestedAt as Date).getTime()) / DAY);
      map.set(k, [...(map.get(k) ?? []), days]);
    }
    const groups = [...map.entries()]
      .filter(([, v]) => v.length >= 3)
      .map(([label, v]) => ({ label, n: v.length, medianDays: round2(median(v)) }))
      .sort((a, b) => b.medianDays - a.medianDays);
    if (groups.length < 2) continue;
    const lo = Math.max(groups[groups.length - 1].medianDays, 0.5);
    const ratio = round2(groups[0].medianDays / lo);
    if (!best || ratio > best.ratio) best = { dimension, groups, ratio };
  }
  return best;
}

function stretch(ss: StretchIn[]): Metrics["stretch"] {
  if (ss.length === 0) return null;
  const map = new Map<string, StretchIn[]>();
  for (const s of ss) map.set(s.tenureBand, [...(map.get(s.tenureBand) ?? []), s]);
  const bands = [...map.entries()]
    .map(([band, v]) => {
      const results = v.map((x) => x.resultRating).filter((x): x is number => typeof x === "number");
      return { band, n: v.length, share: round2(v.length / ss.length), averageResult: results.length ? round2(mean(results)) : null };
    })
    .sort((a, b) => b.n - a.n);
  return { n: ss.length, bands };
}

/** Commitments written in evaluations versus the promotion system of record. */
function promotionCommitments(evals: EvaluationIn[], promos: PromotionIn[], asOf: Date): Metrics["promotionCommitments"] {
  const commitments = evals.filter((e) => e.commitmentType === "promotion" && e.commitmentDue);
  if (commitments.length === 0) return null;
  let kept = 0, missed = 0, pending = 0;
  for (const c of commitments) {
    const due = c.commitmentDue as Date;
    const hit = promos.some(
      (p) => p.subjectRef === c.subjectRef && p.effectiveDate.getTime() >= c.evaluatedAt.getTime() && p.effectiveDate.getTime() <= due.getTime(),
    );
    if (hit) kept++;
    else if (due.getTime() < asOf.getTime()) missed++;
    else pending++;
  }
  return { n: commitments.length, kept, missed, pending };
}

/** Evaluation changes within one cycle (about a year) after a formal concern was filed. */
function evaluationAfterConcern(evals: EvaluationIn[], complaints: ComplaintIn[]): Metrics["evaluationAfterConcern"] {
  let drops = 0;
  const ids: string[] = [];
  for (const c of complaints) {
    const mine = evals.filter((e) => e.subjectRef === c.filerRef).sort((a, b) => a.evaluatedAt.getTime() - b.evaluatedAt.getTime());
    const before = [...mine].reverse().find((e) => e.evaluatedAt.getTime() < c.filedAt.getTime());
    const after = mine.find((e) => e.evaluatedAt.getTime() > c.filedAt.getTime() && e.evaluatedAt.getTime() - c.filedAt.getTime() <= 400 * DAY);
    if (before && after && after.rating < before.rating) {
      drops++;
      ids.push(c.id);
    }
  }
  return { concerns: complaints.length, drops, complaintIds: ids };
}

/** Survey trend across cycles versus the leader's stated culture commitments. */
function cultureTrend(evals: EvaluationIn[], surveys: CycleSurvey[]): Metrics["cultureTrend"] {
  const items = [...new Set(evals.filter((e) => e.commitmentType === "culture" && e.surveyItem).map((e) => e.surveyItem as number))];
  const usable = surveys.filter((s) => !s.result.suppressed && s.result.overall);
  if (items.length === 0 || usable.length < 2) return null;
  const prev = usable[usable.length - 2];
  const cur = usable[usable.length - 1];
  return {
    cycles: [prev.cycleNumber, cur.cycleNumber],
    items: items.sort().map((item) => {
      const previous = prev.result.overall!.averages[item - 1];
      const current = cur.result.overall!.averages[item - 1];
      return { item, previous, current, change: round2(current - previous) };
    }),
  };
}

function selfVsTeamGap(surveys: CycleSurvey[]): Metrics["selfVsTeamGap"] {
  const cur = [...surveys].reverse().find((s) => !s.result.suppressed && s.result.gaps.length > 0);
  if (!cur) return null;
  return {
    cycleNumber: cur.cycleNumber,
    top: cur.result.gaps.slice(0, 6),
    aboveHighBelowLow: new Set(cur.result.gaps.filter((g) => g.aboveHighBelowLow).map((g) => g.question)).size,
  };
}
