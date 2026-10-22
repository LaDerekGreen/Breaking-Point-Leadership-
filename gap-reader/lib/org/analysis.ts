import "server-only";
import type { Prisma } from "@/generated/org";
import { orgDb } from "./db";
import { audit } from "./audit";
import { getSettings, orgAIClient } from "./settings";
import { acknowledgedUserIds, currentNotice } from "./notice";
import { gatherLeaderData } from "./leaderData";
import { computeMetrics } from "./metrics";
import { detectPatterns, patternPersists, type PatternKey } from "./patterns";
import { runGate } from "./gate";
import { writeReport } from "./report";
import { transition } from "./escalation";
import { snapshotOf } from "./findings";

const SURVEY_PATTERNS: PatternKey[] = ["self_vs_team_gap", "culture_trend"];

export type AnalysisSummary = {
  leaders: number;
  findingsDelivered: number;
  proposals: number;
  /** True if the exclusion gate fired for any leader. The program lead sees only GATE_MESSAGE. */
  gateFired: boolean;
  errors: number;
};

/**
 * Deterministic first, AI second (A4). For each leader who has acknowledged
 * the Notice: compute metrics in code, run the exclusion gate, measure
 * persistence for open findings, then detect new patterns and have the AI
 * describe them. The AI's output is the report text and nothing else: no
 * state change anywhere depends on it.
 */
export async function runAnalysis(actorUserId: string): Promise<AnalysisSummary> {
  const notice = await currentNotice();
  if (!notice) throw new Error("Publish the Notice before any analysis runs.");

  const settings = await getSettings();
  const ai = await orgAIClient();
  const acknowledged = await acknowledgedUserIds();

  const leaders = await orgDb.person.findMany({
    where: { user: { roles: { has: "leader" } }, ...(settings.ceoReportsEnabled ? {} : { isChiefExecutive: false }) },
    include: { user: true },
  });

  const summary: AnalysisSummary = { leaders: 0, findingsDelivered: 0, proposals: 0, gateFired: false, errors: 0 };

  for (const leader of leaders) {
    // Only people who have acknowledged the Notice may appear in a report.
    if (!leader.user || !acknowledged.has(leader.user.id)) continue;
    summary.leaders++;
    try {
      const data = await gatherLeaderData(leader.id, settings.anonymityThreshold);
      const metrics = computeMetrics(data);

      const complaintTexts = (await orgDb.complaint.findMany({ where: { leaderId: leader.id, excluded: false }, select: { id: true, text: true } }));
      const gate = await runGate(
        { texts: complaintTexts.map((c) => c.text), retaliationSignals: metrics.evaluationAfterConcern.drops },
        ai,
      );
      if (gate.fired) {
        // Log only that the gate fired, the date, and the record IDs. Store nothing else.
        const recordIds = [...new Set([...metrics.evaluationAfterConcern.complaintIds, ...complaintTexts.map((c) => c.id)])];
        const ev = await orgDb.gateEvent.create({ data: { recordIds: recordIds.length ? recordIds : [`person:${leader.id}`] } });
        await audit({ actorUserId, action: "gate.fired", entityType: "GateEvent", entityId: ev.id });
        summary.gateFired = true;
        continue;
      }

      summary.proposals += await measureOpenFindings(leader.id, settings.anonymityThreshold);

      const open = await orgDb.finding.findMany({ where: { leaderId: leader.id, state: { not: "RESOLVED" } }, select: { patternKey: true } });
      const openKeys = new Set(open.map((f) => f.patternKey));
      const latestCycleId = data.cycleIds[data.cycleIds.length - 1] ?? null;

      for (const pattern of detectPatterns(metrics)) {
        if (openKeys.has(pattern.key)) continue;
        const report = await writeReport(metrics.leaderAnonId, pattern, ai);
        const f = await orgDb.$transaction(async (tx) => {
          const created = await tx.finding.create({
            data: {
              leaderId: leader.id,
              patternKey: pattern.key,
              cycleId: SURVEY_PATTERNS.includes(pattern.key) ? latestCycleId : null,
              metrics: pattern.metrics as Prisma.InputJsonValue,
              report,
              state: "PRIVATE_SURFACING",
            },
          });
          await audit({ actorUserId: null, action: "finding.generated", entityType: "Finding", entityId: created.id, meta: { leaderPersonId: leader.id, by: ai ? "metrics+ai-description" : "metrics+template" } }, tx);
          await audit({ actorUserId: null, action: "report.delivered", entityType: "Finding", entityId: created.id, meta: { to: "leader only", state: "PRIVATE_SURFACING" } }, tx);
          return created;
        });
        if (f) summary.findingsDelivered++;
      }
    } catch (err) {
      summary.errors++;
      await audit({ actorUserId, action: "analysis.error", entityType: "Person", entityId: leader.id, meta: { message: err instanceof Error ? err.message.slice(0, 200) : "unknown" } });
    }
  }

  await audit({ actorUserId, action: "analysis.run", entityType: "Analysis", meta: { ...summary } });
  return summary;
}

/**
 * The next cycle's metrics, over records dated since the leader first opened
 * the finding. The system records whether the pattern persisted and makes a
 * proposal. A person confirms or declines it.
 */
async function measureOpenFindings(leaderId: string, threshold: number): Promise<number> {
  const findings = await orgDb.finding.findMany({
    where: { leaderId, state: { in: ["CORRECTION_WINDOW", "SENIOR_REVIEW"] } },
  });
  let proposals = 0;
  const now = new Date();
  for (const f of findings) {
    if (f.state === "CORRECTION_WINDOW" && (!f.windowEndsAt || f.windowEndsAt > now || f.proposal)) continue;
    const since = f.firstOpenedAt ?? f.deliveredAt;
    const data = await gatherLeaderData(leaderId, threshold, since);
    if (SURVEY_PATTERNS.includes(f.patternKey as PatternKey) && data.surveys.length === 0) continue; // next cycle not measured yet
    const persists = patternPersists(f.patternKey, computeMetrics(data));
    const after = detectPatterns(computeMetrics(data)).find((p) => p.key === f.patternKey);

    await orgDb.$transaction(async (tx) => {
      await tx.finding.update({
        where: { id: f.id },
        data: { patternPersists: persists, persistenceMetrics: (after?.metrics ?? {}) as Prisma.InputJsonValue, persistenceAt: now },
      });
      await audit({ actorUserId: null, action: "finding.persistence_measured", entityType: "Finding", entityId: f.id, meta: { persists } }, tx);
      if (f.state !== "CORRECTION_WINDOW") return;
      const snap = await snapshotOf(f.id, tx);
      const r = transition(snap, { type: persists ? "PROPOSE_ADVANCE" : "PROPOSE_RESOLVE", at: now }, { kind: "system" });
      if (!r.ok) return;
      await tx.finding.update({ where: { id: f.id }, data: { proposal: r.patch.proposal, proposalAt: r.patch.proposalAt } });
      await audit({ actorUserId: null, action: "finding.proposed", entityType: "Finding", entityId: f.id, meta: { proposal: r.patch.proposal ?? null } }, tx);
      proposals++;
    });
  }
  return proposals;
}
