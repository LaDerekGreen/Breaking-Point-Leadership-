import "server-only";
import type { Prisma } from "@/generated/org";
import { orgDb } from "./db";
import { audit } from "./audit";
import { GATE_MESSAGE, runGate } from "./gate";
import { getSettings, orgAIClient } from "./settings";
import { leaderSurveyResult } from "./leaderData";
import { SURVEY_STATEMENTS } from "./survey";

/**
 * A7. A formal performance complaint about a leader is placed beside the
 * documented record and shown privately to the person who filed it, who may
 * add context or withdraw. Nothing enters anyone's record automatically.
 *
 * Concerns about safety, discrimination, harassment or ethics are never
 * checked against the person who raised them: the exclusion gate catches
 * them first, the text leaves the Gap Reader, and the filer is shown the
 * organization's own reporting channels.
 */
export async function processNewComplaints(batchId: string, actorUserId: string) {
  const ai = await orgAIClient();
  const complaints = await orgDb.complaint.findMany({ where: { importBatchId: batchId } });
  let excluded = 0, compared = 0;
  for (const c of complaints) {
    const gate = await runGate({ texts: [c.text], retaliationSignals: 0 }, ai);
    if (gate.fired) {
      await orgDb.$transaction(async (tx) => {
        await tx.complaint.update({ where: { id: c.id }, data: { text: "", excluded: true } });
        const ev = await tx.gateEvent.create({ data: { recordIds: [c.id] } });
        await audit({ actorUserId, action: "gate.fired", entityType: "GateEvent", entityId: ev.id }, tx);
      });
      excluded++;
      continue;
    }
    const snapshot = await comparisonSnapshot(c.leaderId, c.filedAt);
    await orgDb.$transaction(async (tx) => {
      await tx.complaintComparison.create({ data: { complaintId: c.id, snapshot: snapshot as Prisma.InputJsonValue } });
      await audit({ actorUserId: null, action: "complaint.compared", entityType: "Complaint", entityId: c.id, meta: { shownTo: "filer only" } }, tx);
    });
    compared++;
  }
  return { excluded, compared, gateMessage: GATE_MESSAGE };
}

export type ComparisonSnapshot = {
  asOf: string;
  surveys: { cycle: string; n: number; averages: { statement: string; average: number }[] } | { cycle: string; suppressed: true } | null;
  decisions: { total: number; withDocumentedReason: number; withAlternatives: number };
  evaluations: { count: number; averageRating: number | null };
  stretch: { count: number };
  notAvailable: string[];
};

/** The documented record for the leader's team, using only A2 sources and threshold-safe survey results. */
export async function comparisonSnapshot(leaderId: string, asOf: Date): Promise<ComparisonSnapshot> {
  const { anonymityThreshold } = await getSettings();
  const since = new Date(asOf.getTime() - 365 * 86400000);
  const [cycle, decisions, evals, stretch] = await Promise.all([
    orgDb.surveyCycle.findFirst({ where: { status: "closed" }, orderBy: { number: "desc" } }),
    orgDb.decisionRecord.findMany({ where: { leaderId, decidedAt: { gte: since, lte: asOf } } }),
    orgDb.evaluation.findMany({ where: { leaderId, evaluatedAt: { gte: since, lte: asOf } } }),
    orgDb.stretchAssignment.count({ where: { leaderId, assignedAt: { gte: since, lte: asOf } } }),
  ]);
  let surveys: ComparisonSnapshot["surveys"] = null;
  if (cycle) {
    const r = await leaderSurveyResult(cycle.id, leaderId, anonymityThreshold);
    surveys = r.suppressed || !r.overall
      ? { cycle: cycle.name, suppressed: true }
      : { cycle: cycle.name, n: r.overall.n, averages: r.overall.averages.map((a, i) => ({ statement: SURVEY_STATEMENTS[i], average: a })) };
  }
  return {
    asOf: asOf.toISOString().slice(0, 10),
    surveys,
    decisions: {
      total: decisions.length,
      withDocumentedReason: decisions.filter((x) => x.documentedReason.trim()).length,
      withAlternatives: decisions.filter((x) => x.alternativesConsidered.trim()).length,
    },
    evaluations: { count: evals.length, averageRating: evals.length ? Math.round((evals.reduce((s, e) => s + e.rating, 0) / evals.length) * 100) / 100 : null },
    stretch: { count: stretch },
    // Output and safety incident records are not among the sources the Gap Reader may read (A2).
    notAvailable: ["Team output records", "Safety incident records"],
  };
}

export async function filerComplaints(personId: string) {
  return orgDb.complaint.findMany({ where: { filerPersonId: personId }, include: { comparison: true }, orderBy: { filedAt: "desc" } });
}

export async function filerRespond(complaintId: string, personId: string, userId: string, action: "context" | "withdraw", text?: string) {
  const c = await orgDb.complaint.findUnique({ where: { id: complaintId }, include: { comparison: true } });
  if (!c || c.filerPersonId !== personId || !c.comparison) throw new Error("Not found.");
  await orgDb.$transaction(async (tx) => {
    await tx.complaintComparison.update({
      where: { id: c.comparison!.id },
      data: action === "withdraw" ? { withdrawnAt: new Date() } : { filerContext: (text ?? "").trim().slice(0, 10000) },
    });
    await audit({ actorUserId: userId, action: action === "withdraw" ? "complaint.withdrawn" : "complaint.context_added", entityType: "Complaint", entityId: c.id }, tx);
  });
}
