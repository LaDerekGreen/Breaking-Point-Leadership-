/**
 * Seed data: a fictional organization ("Harbor Point Distribution, sample")
 * with fictional roles. No real names: every person is labeled by role.
 *
 * Run with: npm run db:seed   (after scripts/reset-dev-db.sh)
 *
 * Sign in as any of these (magic links print to the server log in development):
 *   lead@example.org      program lead
 *   ops@example.org       leader (Operations Director) with findings
 *   wh@example.org        leader (Warehouse Manager)
 *   finance@example.org   senior reviewer
 *   board@example.org     board reviewer
 *   ceo@example.org       chief executive
 *   analyst01@example.org respondent (and one complaint filer)
 */
import { PrismaClient, type Role, type Vantage } from "../generated/org";
import { DEFAULT_NOTICE } from "../lib/org/notice";
import { upsertPeople, type DirectoryRow } from "../lib/org/directory";
import { runAnalysis } from "../lib/org/analysis";
import { importRows } from "../lib/org/importer";

const db = new PrismaClient({ datasourceUrl: process.env.ORG_DATABASE_URL });
const DAY = 86400000;
const ago = (d: number) => new Date(Date.now() - d * DAY);
const iso = (d: Date) => d.toISOString().slice(0, 10);

async function main() {
  const existing = await db.person.count();
  if (existing > 0) {
    console.log("The org schema already has data. Run scripts/reset-dev-db.sh first.");
    return;
  }

  const P = (externalId: string, displayName: string, roleTitle: string, managerExternalId: string | undefined, email: string | undefined, roles: Role[], extra: Partial<DirectoryRow> = {}): DirectoryRow => ({
    externalId, displayName, roleTitle, managerExternalId, email, roles, ...extra,
  });

  const rows: DirectoryRow[] = [
    P("E-001", "Chief Executive (sample)", "Chief Executive", undefined, "ceo@example.org", ["leader"], { isChiefExecutive: true, jobLevel: "Executive" }),
    P("E-002", "People Programs Lead (sample)", "Director, People Programs", "E-001", "lead@example.org", ["program_lead", "respondent"], { jobLevel: "Director" }),
    P("E-003", "Finance Vice President (sample)", "Vice President, Finance", "E-001", "finance@example.org", ["senior_reviewer", "leader", "respondent"], { jobLevel: "Executive" }),
    P("E-004", "Operations Director (sample)", "Director, Operations", "E-001", "ops@example.org", ["leader", "respondent"], { jobLevel: "Director" }),
    P("E-005", "Board Member A (sample)", "Board Member", undefined, "board@example.org", ["board_reviewer"], { jobLevel: "Board" }),
    P("E-006", "Warehouse Manager (sample)", "Manager, Warehouse", "E-004", "wh@example.org", ["leader", "respondent"], { jobLevel: "Manager" }),
    P("E-007", "Sales Director (sample)", "Director, Sales", "E-001", "sales@example.org", ["respondent"], { jobLevel: "Director" }),
  ];
  for (let i = 1; i <= 12; i++) {
    const n = String(i).padStart(2, "0");
    rows.push(P(`E-1${n}`, `Analyst ${n} (sample)`, "Operations Analyst", "E-004", `analyst${n}@example.org`, ["respondent"], { jobLevel: i <= 6 ? "Analyst I" : "Analyst II" }));
  }
  for (let i = 1; i <= 9; i++) {
    const n = String(i).padStart(2, "0");
    rows.push(P(`E-2${n}`, `Associate ${n} (sample)`, "Warehouse Associate", "E-006", `associate${n}@example.org`, ["respondent"], { jobLevel: "Associate" }));
  }

  const bootstrap = await db.user.create({ data: { email: "seed@example.org", roles: ["program_lead"] } });
  await upsertPeople(rows, bootstrap.id);
  const lead = await db.user.findUniqueOrThrow({ where: { email: "lead@example.org" } });
  await db.user.delete({ where: { id: bootstrap.id } });

  // A1: the Notice, published and acknowledged by everyone.
  await db.orgSettings.upsert({
    where: { id: 1 },
    create: { id: 1, organizationName: "Harbor Point Distribution (sample)", reportingChannels: "Ethics line: 1-800-000-0000 (sample)\nPeople team: people@example.org\nSafety desk: safety@example.org" },
    update: {},
  });
  const notice = await db.notice.create({ data: { version: 1, ...DEFAULT_NOTICE, publishedAt: ago(200), publishedById: lead.id } });
  const users = await db.user.findMany();
  await db.noticeAcknowledgment.createMany({ data: users.map((u) => ({ userId: u.id, noticeId: notice.id, acknowledgedAt: ago(190) })) });

  const person = (ext: string) => db.person.findUniqueOrThrow({ where: { externalId: ext } });
  const ops = await person("E-004");
  const wh = await person("E-006");
  const finance = await db.user.findUniqueOrThrow({ where: { email: "finance@example.org" } });
  await db.reviewerAssignment.create({ data: { leaderPersonId: ops.id, seniorReviewerUserId: finance.id, assignedById: lead.id } });

  // A3: two closed cycles of the Three Vantage Point Survey for the Operations Director.
  const resp = (vantage: Vantage, answers: number[], jobLevel?: string, open?: string) => ({ vantage, answers, jobLevel, comments: Array(8).fill(""), openAnswer: open ?? null });
  for (const [num, closedDaysAgo] of [[1, 160], [2, 20]] as const) {
    const cycle = await db.surveyCycle.create({ data: { number: num, name: num === 1 ? "Spring cycle (sample)" : "Autumn cycle (sample)", status: "closed", openedAt: ago(closedDaysAgo + 14), closedAt: ago(closedDaysAgo) } });
    await db.leaderSelfRating.create({ data: { cycleId: cycle.id, leaderId: ops.id, answers: [5, 5, 4, 5, 4, 5, 5, 4] } });
    const drift = num === 2 ? -0.4 : 0;
    const below = Array.from({ length: 12 }, (_, i) =>
      resp("below", [2, 2, 3, 3, 3, 4, 2, 3].map((x, q) => Math.min(5, Math.max(1, Math.round(x + (q === 1 ? drift * 2 : 0) + ((i % 3) - 1) * 0.4)))), i < 6 ? "Analyst I" : "Analyst II", i === 0 ? "Decisions are announced before we finish presenting." : undefined),
    );
    const beside = Array.from({ length: 3 }, () => resp("beside", [3, 4, 3, 4, 3, 4, 3, 3], "Director"));
    const above = [resp("above", [5, 5, 4, 5, 4, 5, 5, 4], "Executive")];
    await db.surveyResponse.createMany({ data: [...below, ...beside, ...above].map((r) => ({ ...r, cycleId: cycle.id, leaderId: ops.id })) });
  }

  // A2: records the organization already keeps, through the same import path the console uses.
  const csvRows = (objs: Record<string, string | number>[]) => objs.map((o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, String(v)])));
  const decisions: Record<string, string | number>[] = [];
  for (let i = 0; i < 14; i++) {
    const decided = ago(250 - i * 15);
    const night = i % 2 === 0;
    decisions.push({
      leader_id: "E-004", type: "recommendation", date: iso(decided), requested_at: iso(new Date(decided.getTime() - (night ? 9 : 2) * DAY)),
      affected_role: "Operations Analyst", documented_reason: i % 4 === 0 ? "" : "Budget timing", alternatives_considered: i % 3 === 0 ? "Pilot first" : "",
      outcome: i % 5 === 0 ? "accepted" : i % 2 ? "dismissed" : "deferred", shift: night ? "Night" : "Day", team: "Inbound", tenure_band: i % 2 ? "0-2 years" : "10+ years",
      minutes_before_opinion: i % 6 === 0 ? 4 : 0,
    });
  }
  const h = (o: Record<string, unknown>[]) => [...new Set(o.flatMap((r) => Object.keys(r)))];
  await importRows("decisions", { fileName: "decisions-sample.csv", headers: h(decisions), rows: csvRows(decisions) }, lead.id);

  const evals = [
    { leader_id: "E-004", subject_ref: "S-101", date: iso(ago(400)), rating: 4, commitment: "Promote to Analyst II within the year", commitment_type: "promotion", commitment_due: iso(ago(40)), survey_item: "" },
    { leader_id: "E-004", subject_ref: "S-102", date: iso(ago(380)), rating: 4, commitment: "Promote to Senior Analyst by spring", commitment_type: "promotion", commitment_due: iso(ago(90)), survey_item: "" },
    { leader_id: "E-004", subject_ref: "S-103", date: iso(ago(370)), rating: 3, commitment: "Promote to Analyst II", commitment_type: "promotion", commitment_due: iso(ago(60)), survey_item: "" },
    { leader_id: "E-004", subject_ref: "S-104", date: iso(ago(300)), rating: 4, commitment: "I will bring bad news to the team first", commitment_type: "culture", commitment_due: "", survey_item: 2 },
    { leader_id: "E-006", subject_ref: "S-201", date: iso(ago(300)), rating: 3, commitment: "", commitment_type: "", commitment_due: "", survey_item: "" },
  ];
  await importRows("evaluations", { fileName: "evaluations-sample.csv", headers: h(evals), rows: csvRows(evals) }, lead.id);
  const promos = [{ subject_ref: "S-103", candidate_role: "Analyst II", approval_date: iso(ago(100)), effective_date: iso(ago(80)) }];
  await importRows("promotions", { fileName: "promotions-sample.csv", headers: h(promos), rows: csvRows(promos) }, lead.id);
  const stretch = Array.from({ length: 8 }, (_, i) => ({
    leader_id: "E-004", date: iso(ago(300 - i * 20)), recipient_role: "Operations Analyst", recipient_ref: `S-1${i}`, tenure_band: i < 6 ? "10+ years" : "0-2 years", result_rating: i < 6 ? 3 : 4,
  }));
  await importRows("stretch", { fileName: "stretch-sample.csv", headers: h(stretch), rows: csvRows(stretch) }, lead.id);

  // A7: one ordinary performance complaint (compared with the record, shown to the filer)
  // and one concern that falls outside the Gap Reader (the gate fires).
  const complaints = [
    { leader_id: "E-006", date: iso(ago(30)), filer_role: "Operations Analyst", filer_ref: "E-101", text: "Shift handovers are rushed and our questions go unanswered for days." },
    { leader_id: "E-006", date: iso(ago(25)), filer_role: "Warehouse Associate", filer_ref: "E-201", text: "I was harassed on the night shift." },
  ];
  await importRows("complaints", { fileName: "complaints-sample.csv", headers: h(complaints), rows: csvRows(complaints) }, lead.id);

  // A4: run the analysis. Reports go privately to the leader concerned.
  const summary = await runAnalysis(lead.id);
  console.log("Analysis:", summary);
  console.log(`Seeded ${rows.length} people, Notice version ${notice.version}. Warehouse Manager: ${wh.id}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
