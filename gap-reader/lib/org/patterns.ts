/**
 * Deterministic pattern detection over computed metrics. A pattern is a
 * threshold crossed in the record, nothing more. Most findings are ordinary.
 *
 * The same function measures persistence: a finding's pattern persists if
 * the next cycle's metrics still cross the same threshold.
 */

import type { Metrics } from "./metrics";
import { SURVEY_STATEMENTS } from "./survey";

export type PatternKey =
  | "self_vs_team_gap"
  | "opinion_before_questions"
  | "recommendations_dismissed"
  | "approval_latency"
  | "stretch_distribution"
  | "promotion_commitments"
  | "culture_trend";

export type Pattern = { key: PatternKey; title: string; summary: string; metrics: Record<string, unknown> };

export const PATTERN_TITLES: Record<PatternKey, string> = {
  self_vs_team_gap: "The gap between how you see yourself and how others see you",
  opinion_before_questions: "Opinions before questions",
  recommendations_dismissed: "Recommendations dismissed or deferred",
  approval_latency: "Approval time differs by group",
  stretch_distribution: "Who receives stretch assignments",
  promotion_commitments: "Promotion commitments and the record",
  culture_trend: "Survey trend against stated culture commitments",
};

export const THRESHOLDS = {
  gap: 1.0,
  opinionFirstShare: 0.6,
  opinionMinN: 5,
  dismissedShare: 0.6,
  dismissedMinN: 5,
  latencyRatio: 2.0,
  stretchTopShare: 0.6,
  stretchMinN: 5,
  missedCommitments: 2,
  missedShare: 0.5,
  cultureDrop: -0.3,
};

export function detectPatterns(m: Metrics): Pattern[] {
  const out: Pattern[] = [];

  const g = m.selfVsTeamGap;
  if (g) {
    const big = g.top.filter((r) => Math.abs(r.gap) >= THRESHOLDS.gap);
    if (big.length > 0) {
      const r = big[0];
      out.push({
        key: "self_vs_team_gap",
        title: PATTERN_TITLES.self_vs_team_gap,
        summary: `On "${SURVEY_STATEMENTS[r.question - 1]}" you rated yourself ${r.self}; the ${r.group} group's average was ${r.others}, a gap of ${r.gap}.`,
        metrics: { cycleNumber: g.cycleNumber, gaps: big, aboveHighBelowLowQuestions: g.aboveHighBelowLow },
      });
    }
  }

  const t = m.timeBeforeOpinion;
  if (t && t.n >= THRESHOLDS.opinionMinN && t.shareOpinionFirst >= THRESHOLDS.opinionFirstShare) {
    out.push({
      key: "opinion_before_questions",
      title: PATTERN_TITLES.opinion_before_questions,
      summary: `In ${Math.round(t.shareOpinionFirst * 100)}% of ${t.n} recorded decisions, an opinion was given before any question.`,
      metrics: t,
    });
  }

  const rec = m.recommendations;
  if (rec && rec.n >= THRESHOLDS.dismissedMinN && rec.dismissedOrDeferredShare >= THRESHOLDS.dismissedShare) {
    out.push({
      key: "recommendations_dismissed",
      title: PATTERN_TITLES.recommendations_dismissed,
      summary: `${rec.dismissed + rec.deferred} of ${rec.n} recommendations were dismissed or deferred.`,
      metrics: rec,
    });
  }

  const lat = m.approvalLatency;
  if (lat && lat.ratio >= THRESHOLDS.latencyRatio) {
    const hi = lat.groups[0], lo = lat.groups[lat.groups.length - 1];
    out.push({
      key: "approval_latency",
      title: PATTERN_TITLES.approval_latency,
      summary: `By ${lat.dimension}, approvals for ${hi.label} took a median of ${hi.medianDays} days; for ${lo.label}, ${lo.medianDays} days.`,
      metrics: lat,
    });
  }

  const s = m.stretch;
  if (s && s.n >= THRESHOLDS.stretchMinN && s.bands.length >= 2) {
    const top = s.bands[0];
    const others = s.bands.slice(1).filter((b) => b.averageResult !== null);
    const othersAvg = others.length ? others.reduce((a, b) => a + (b.averageResult as number) * b.n, 0) / others.reduce((a, b) => a + b.n, 0) : null;
    const notExplainedByResults = top.averageResult === null || othersAvg === null || top.averageResult <= othersAvg;
    if (top.share >= THRESHOLDS.stretchTopShare && notExplainedByResults) {
      out.push({
        key: "stretch_distribution",
        title: PATTERN_TITLES.stretch_distribution,
        summary: `${Math.round(top.share * 100)}% of ${s.n} stretch assignments went to the ${top.band} tenure band, whose documented results were not higher than the others'.`,
        metrics: s,
      });
    }
  }

  const pc = m.promotionCommitments;
  if (pc && (pc.missed >= THRESHOLDS.missedCommitments || (pc.kept + pc.missed > 0 && pc.missed / (pc.kept + pc.missed) >= THRESHOLDS.missedShare && pc.missed > 0))) {
    out.push({
      key: "promotion_commitments",
      title: PATTERN_TITLES.promotion_commitments,
      summary: `${pc.missed} of ${pc.n} written promotion commitments passed their stated date with no matching promotion in the system of record.`,
      metrics: pc,
    });
  }

  const c = m.cultureTrend;
  if (c) {
    const drops = c.items.filter((i) => i.change <= THRESHOLDS.cultureDrop);
    if (drops.length > 0) {
      out.push({
        key: "culture_trend",
        title: PATTERN_TITLES.culture_trend,
        summary: `Survey scores fell on ${drops.length} statement${drops.length === 1 ? "" : "s"} tied to a written culture commitment, between cycles ${c.cycles[0]} and ${c.cycles[1]}.`,
        metrics: { cycles: c.cycles, items: drops },
      });
    }
  }

  return out;
}

export function patternPersists(key: string, next: Metrics): boolean {
  return detectPatterns(next).some((p) => p.key === key);
}
