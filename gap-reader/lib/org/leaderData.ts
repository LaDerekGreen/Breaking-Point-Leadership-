import "server-only";
import { orgDb } from "./db";
import { computeSurveyResult, type AnonymousResponse, type SurveyResult } from "./anonymity";
import type { CycleSurvey, LeaderData } from "./metrics";

/** Survey results for one leader and one closed cycle, after the anonymity threshold. */
export async function leaderSurveyResult(cycleId: string, leaderId: string, threshold: number, by: "vantage" | "jobLevel" = "vantage"): Promise<SurveyResult> {
  const [responses, self] = await Promise.all([
    orgDb.surveyResponse.findMany({ where: { cycleId, leaderId } }),
    orgDb.leaderSelfRating.findUnique({ where: { cycleId_leaderId: { cycleId, leaderId } } }),
  ]);
  const rs: AnonymousResponse[] = responses.map((r) => ({
    vantage: r.vantage,
    jobLevel: r.jobLevel,
    answers: r.answers,
    comments: r.comments,
    openAnswer: r.openAnswer,
  }));
  return computeSurveyResult(rs, self?.answers ?? null, threshold, by);
}

/**
 * Everything the metrics need for one leader, from records only. With
 * `since`, only records dated on or after it (used to measure whether a
 * pattern persisted after the correction window opened).
 */
export async function gatherLeaderData(personId: string, threshold: number, since?: Date): Promise<LeaderData & { cycleIds: string[] }> {
  const person = await orgDb.person.findUniqueOrThrow({ where: { id: personId } });
  const date = since ? { gte: since } : undefined;
  const [decisions, evaluations, stretch, complaints, cycles] = await Promise.all([
    orgDb.decisionRecord.findMany({ where: { leaderId: personId, decidedAt: date } }),
    orgDb.evaluation.findMany({ where: { leaderId: personId, evaluatedAt: date } }),
    orgDb.stretchAssignment.findMany({ where: { leaderId: personId, assignedAt: date } }),
    orgDb.complaint.findMany({ where: { leaderId: personId, excluded: false, filedAt: date } }),
    orgDb.surveyCycle.findMany({ where: { status: "closed", closedAt: date }, orderBy: { number: "asc" } }),
  ]);
  // Evaluations of filers are needed in full to see a change after a concern.
  const filerRefs = [...new Set(complaints.map((c) => c.filerRef))];
  const allEvals = since
    ? [...evaluations, ...(await orgDb.evaluation.findMany({ where: { leaderId: personId, subjectRef: { in: filerRefs }, evaluatedAt: { lt: since } } }))]
    : evaluations;
  const subjectRefs = [...new Set(allEvals.map((e) => e.subjectRef))];
  const promotions = await orgDb.promotionRecord.findMany({ where: { subjectRef: { in: subjectRefs } } });

  const surveys: CycleSurvey[] = [];
  for (const c of cycles) surveys.push({ cycleNumber: c.number, result: await leaderSurveyResult(c.id, personId, threshold) });

  return {
    leaderAnonId: person.anonId,
    asOf: new Date(),
    decisions,
    evaluations: allEvals,
    promotions,
    stretch,
    complaints: complaints.map((c) => ({ id: c.id, filerRef: c.filerRef, filedAt: c.filedAt })),
    surveys,
    cycleIds: cycles.map((c) => c.id),
  };
}
