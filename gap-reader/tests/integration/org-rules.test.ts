/** Integration test: the organizational hard rules hold in the database and the pipeline. */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prepareTestDb } from "./testDb";

type OrgDb = typeof import("@/lib/org/db")["orgDb"];
let orgDb: OrgDb;
let leadId: string;
let leaderUser: { id: string; email: string; name: null; roles: ("leader" | "respondent")[]; personId: string };

beforeAll(async () => {
  await prepareTestDb();
  orgDb = (await import("@/lib/org/db")).orgDb;
  const { upsertPeople } = await import("@/lib/org/directory");
  const boot = await orgDb.user.create({ data: { email: "boot@example.org", roles: ["program_lead"] } });
  const rows = [
    { externalId: "L1", displayName: "Leader (test)", roleTitle: "Director", email: "leader@example.org", roles: ["leader" as const] },
    { externalId: "P1", displayName: "Lead (test)", roleTitle: "Program lead", email: "lead@example.org", roles: ["program_lead" as const] },
    ...Array.from({ length: 9 }, (_, i) => ({ externalId: `R${i}`, displayName: `Report ${i} (test)`, roleTitle: "Analyst", managerExternalId: "L1", email: `r${i}@example.org`, roles: ["respondent" as const] })),
  ];
  await upsertPeople(rows, boot.id);
  leadId = (await orgDb.user.findUniqueOrThrow({ where: { email: "lead@example.org" } })).id;
  const lu = await orgDb.user.findUniqueOrThrow({ where: { email: "leader@example.org" } });
  leaderUser = { id: lu.id, email: lu.email, name: null, roles: ["leader"], personId: lu.personId! };
  await orgDb.orgSettings.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });
});

afterAll(async () => {
  await orgDb?.$disconnect();
});

describe("organizational hard rules, end to end", () => {
  it("the database refuses an anonymity threshold below eight and a window below ninety days", async () => {
    await expect(orgDb.orgSettings.update({ where: { id: 1 }, data: { anonymityThreshold: 5 } })).rejects.toThrow();
    await expect(orgDb.orgSettings.update({ where: { id: 1 }, data: { correctionWindowDays: 30 } })).rejects.toThrow();
    await expect(orgDb.orgSettings.update({ where: { id: 1 }, data: { anonymityThreshold: 10, correctionWindowDays: 120 } })).resolves.toBeTruthy();
    await orgDb.orgSettings.update({ where: { id: 1 }, data: { anonymityThreshold: 8, correctionWindowDays: 90 } });
  });

  it("no analysis runs before the Notice is published", async () => {
    const { runAnalysis } = await import("@/lib/org/analysis");
    await expect(runAnalysis(leadId)).rejects.toThrow(/Notice/);
  });

  it("an import with a forbidden field is rejected whole and the rejection is logged", async () => {
    const { importRows } = await import("@/lib/org/importer");
    const r = await importRows("decisions", { fileName: "bad.csv", headers: ["leader_id", "type", "date", "affected_role", "documented_reason", "alternatives_considered", "email_body"], rows: [] }, leadId);
    expect(r.ok).toBe(false);
    expect(await orgDb.decisionRecord.count()).toBe(0);
    expect(await orgDb.auditLog.count({ where: { action: "import.rejected_forbidden_field" } })).toBe(1);
  });

  it("the gate fires on a harassment complaint: no comparison, no analysis, only the date and record ID", async () => {
    const n = await orgDb.notice.create({ data: { version: 1, reads: "x", neverReads: "y", publishedAt: new Date() } });
    const users = await orgDb.user.findMany();
    await orgDb.noticeAcknowledgment.createMany({ data: users.map((u) => ({ userId: u.id, noticeId: n.id })) });
    const { importRows } = await import("@/lib/org/importer");
    const r = await importRows("complaints", { fileName: "c.csv", headers: ["leader_id", "date", "filer_role", "filer_ref", "text"], rows: [{ leader_id: "L1", date: "2026-09-01", filer_role: "Analyst", filer_ref: "R1", text: "He has been harassing me after hours." }] }, leadId);
    expect(r.ok).toBe(true);
    const c = await orgDb.complaint.findFirstOrThrow();
    expect(c.excluded).toBe(true);
    expect(c.text).toBe("");
    expect(await orgDb.complaintComparison.count()).toBe(0);
    const ev = await orgDb.gateEvent.findFirstOrThrow();
    expect(Object.keys(ev).sort()).toEqual(["firedAt", "id", "recordIds"]);
    expect(ev.recordIds).toEqual([c.id]);
  });

  it("an ordinary complaint is placed beside the record for the filer only", async () => {
    const { importRows } = await import("@/lib/org/importer");
    await importRows("complaints", { fileName: "c2.csv", headers: ["leader_id", "date", "filer_role", "filer_ref", "text"], rows: [{ leader_id: "L1", date: "2026-09-02", filer_role: "Analyst", filer_ref: "R2", text: "Meetings run long and decisions come before we finish." }] }, leadId);
    const c = await orgDb.complaint.findFirstOrThrow({ where: { excluded: false }, include: { comparison: true } });
    expect(c.comparison).not.toBeNull();
    const r2 = await orgDb.person.findUniqueOrThrow({ where: { externalId: "R2" } });
    expect(c.filerPersonId).toBe(r2.id);
    expect(await orgDb.finding.count()).toBe(0); // nothing enters anyone's record automatically
  });

  it("survey answers carry no link to the person, and a person answers once", async () => {
    const { createCycle, inviteCircle, setCycleStatus, submitResponse } = await import("@/lib/org/surveyAdmin");
    const cycle = await createCycle("Test", leadId);
    await inviteCircle(cycle.id, leaderUser.personId, leadId);
    await setCycleStatus(cycle.id, "open", leadId);
    const inv = await orgDb.surveyInvitation.findFirstOrThrow({ where: { cycleId: cycle.id } });
    const u = await orgDb.user.findUniqueOrThrow({ where: { id: inv.userId } });
    const respondent = { id: u.id, email: u.email, name: null, roles: u.roles as never, personId: u.personId };
    await submitResponse(inv.id, respondent, { vantage: "below", answers: [1, 2, 3, 4, 5, 1, 2, 3], comments: Array(8).fill("") });
    await expect(submitResponse(inv.id, respondent, { vantage: "below", answers: [1, 2, 3, 4, 5, 1, 2, 3], comments: Array(8).fill("") })).rejects.toThrow(/already/);
    const resp = await orgDb.surveyResponse.findFirstOrThrow();
    expect(Object.keys(resp).sort()).toEqual(["answers", "comments", "cycleId", "id", "jobLevel", "leaderId", "openAnswer", "vantage"]);
    await setCycleStatus(cycle.id, "closed", leadId);
    const { leaderSurveyResult } = await import("@/lib/org/leaderData");
    expect((await leaderSurveyResult(cycle.id, leaderUser.personId, 8)).suppressed).toBe(true); // one answer: nothing shown
  });

  it("a finding goes to the leader alone; the program lead sees delivery status, not contents", async () => {
    const { importRows } = await import("@/lib/org/importer");
    const rows = Array.from({ length: 6 }, (_, i) => ({ leader_id: "L1", type: "recommendation", date: `2026-0${i + 1}-10`, affected_role: "Analyst", documented_reason: "", alternatives_considered: "", outcome: "dismissed", minutes_before_opinion: "0" }));
    await importRows("decisions", { fileName: "d.csv", headers: Object.keys(rows[0]), rows }, leadId);
    await orgDb.complaint.deleteMany({ where: { excluded: false } }); // keep the analysis about decisions only
    const { runAnalysis } = await import("@/lib/org/analysis");
    const s = await runAnalysis(leadId);
    expect(s.findingsDelivered).toBeGreaterThan(0);
    const { deliveryStatus, loadFindingFor } = await import("@/lib/org/findings");
    const status = await deliveryStatus();
    expect(status.length).toBeGreaterThan(0);
    for (const row of status) {
      expect(row).not.toHaveProperty("report");
      expect(row).not.toHaveProperty("metrics");
    }
    const f = await orgDb.finding.findFirstOrThrow();
    const lead = await orgDb.user.findUniqueOrThrow({ where: { id: leadId } });
    expect(await loadFindingFor(f.id, { id: lead.id, email: lead.email, name: null, roles: ["program_lead"], personId: lead.personId })).toBeNull();
    const mine = await loadFindingFor(f.id, leaderUser as never);
    expect(mine?.as).toBe("leader");
    expect(mine?.finding.report).toMatch(/What, if anything, will you do about it\?$/);
    // Names never reach the report or the metrics.
    expect(JSON.stringify(mine?.finding.metrics)).not.toMatch(/Leader \(test\)|Report \d \(test\)/);
    expect(mine?.finding.report).not.toMatch(/\(test\)/);
  });

  it("every finding generated and report delivered is in the audit log", async () => {
    const findings = await orgDb.finding.count();
    expect(await orgDb.auditLog.count({ where: { action: "finding.generated" } })).toBe(findings);
    expect(await orgDb.auditLog.count({ where: { action: "report.delivered" } })).toBe(findings);
  });
});
