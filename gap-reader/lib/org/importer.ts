import "server-only";
import Papa from "papaparse";
import { orgDb } from "./db";
import { audit } from "./audit";
import { checkHeaders, parseRows, IMPORT_LABELS, type ImportKind } from "./importSchema";
import { processNewComplaints } from "./complaints";

export type ImportOutcome =
  | { ok: true; batchId: string; rows: number; message: string }
  | { ok: false; message: string; details: string[] };

const d = (s?: string) => (s ? new Date(s) : null);

export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const parsed = Papa.parse<Record<string, string>>(text.trim(), { header: true, skipEmptyLines: true });
  return { headers: parsed.meta.fields ?? [], rows: parsed.data };
}

/** CSV and API imports share this path, so the same schema-level rules apply to both. */
export async function importRows(
  kind: ImportKind,
  source: { fileName: string; headers: string[]; rows: Record<string, string>[] },
  actorUserId: string,
): Promise<ImportOutcome> {
  const header = checkHeaders(kind, source.headers);
  if (!header.ok) {
    const details = [
      ...header.forbidden.map((f) => `Column "${f.column}" looks like ${f.label}. The Gap Reader never reads this.`),
      ...header.unknown.map((c) => `Column "${c}" is not part of the ${IMPORT_LABELS[kind].toLowerCase()} schema.`),
      ...header.missing.map((c) => `Required column "${c}" is missing.`),
    ];
    await audit({
      actorUserId,
      action: header.forbidden.length ? "import.rejected_forbidden_field" : "import.rejected_schema",
      entityType: "Import",
      reason: "Rejected at the schema level before any row was read.",
      meta: { kind, fileName: source.fileName, forbidden: header.forbidden.map((f) => f.label), unknownColumns: header.unknown, missing: header.missing },
    });
    return { ok: false, message: header.forbidden.length ? "This file was rejected. It contains fields the Gap Reader never reads." : "This file does not match the schema.", details };
  }

  const parsed = parseRows(kind, source.rows);
  if (!parsed.ok) {
    await audit({ actorUserId, action: "import.rejected_rows", entityType: "Import", meta: { kind, fileName: source.fileName, errors: parsed.errors.length } });
    return { ok: false, message: "Some rows are not valid. Nothing was imported.", details: parsed.errors.slice(0, 20).map((e) => `Row ${e.row}: ${e.message}`) };
  }

  // Leaders are referenced by the directory's external ID.
  const leaderRefs = new Set<string>();
  for (const r of parsed.rows as Record<string, unknown>[]) if (typeof r.leader_id === "string") leaderRefs.add(r.leader_id);
  const leaders = await orgDb.person.findMany({ where: { externalId: { in: [...leaderRefs] } } });
  const leaderId = new Map(leaders.map((p) => [p.externalId, p.id]));
  const missing = [...leaderRefs].filter((r) => !leaderId.has(r));
  if (missing.length) {
    await audit({ actorUserId, action: "import.rejected_rows", entityType: "Import", meta: { kind, fileName: source.fileName, unknownLeaders: missing.length } });
    return { ok: false, message: "Some leader IDs are not in the directory. Nothing was imported.", details: missing.slice(0, 20).map((m) => `Unknown leader_id: ${m}`) };
  }

  const batch = await orgDb.$transaction(async (tx) => {
    const b = await tx.importBatch.create({ data: { kind, fileName: source.fileName, rowCount: parsed.rows.length, importedById: actorUserId } });
    const rows = parsed.rows as Record<string, string | number | undefined>[];
    const s = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
    const n = (v: unknown) => (typeof v === "number" ? v : null);
    switch (kind) {
      case "decisions":
        await tx.decisionRecord.createMany({
          data: rows.map((r) => ({
            leaderId: leaderId.get(r.leader_id as string)!,
            type: r.type as string,
            decidedAt: new Date(r.date as string),
            requestedAt: d(s(r.requested_at) ?? undefined),
            affectedRole: r.affected_role as string,
            documentedReason: (r.documented_reason as string) ?? "",
            alternativesConsidered: (r.alternatives_considered as string) ?? "",
            outcome: (s(r.outcome) as never) ?? null,
            shift: s(r.shift),
            team: s(r.team),
            tenureBand: s(r.tenure_band),
            minutesBeforeOpinion: n(r.minutes_before_opinion),
            importBatchId: b.id,
          })),
        });
        break;
      case "promotions":
        await tx.promotionRecord.createMany({
          data: rows.map((r) => ({
            subjectRef: r.subject_ref as string,
            candidateRole: r.candidate_role as string,
            approvalDate: new Date(r.approval_date as string),
            effectiveDate: new Date(r.effective_date as string),
            importBatchId: b.id,
          })),
        });
        break;
      case "evaluations":
        await tx.evaluation.createMany({
          data: rows.map((r) => ({
            leaderId: leaderId.get(r.leader_id as string)!,
            subjectRef: r.subject_ref as string,
            evaluatedAt: new Date(r.date as string),
            rating: r.rating as number,
            commitmentText: s(r.commitment),
            commitmentType: (s(r.commitment_type) as never) ?? null,
            commitmentDue: d(s(r.commitment_due) ?? undefined),
            surveyItem: n(r.survey_item),
            importBatchId: b.id,
          })),
        });
        break;
      case "stretch":
        await tx.stretchAssignment.createMany({
          data: rows.map((r) => ({
            leaderId: leaderId.get(r.leader_id as string)!,
            assignedAt: new Date(r.date as string),
            recipientRole: r.recipient_role as string,
            recipientRef: s(r.recipient_ref),
            tenureBand: r.tenure_band as string,
            resultRating: n(r.result_rating),
            importBatchId: b.id,
          })),
        });
        break;
      case "complaints": {
        const filers = await tx.person.findMany({ where: { OR: [{ externalId: { in: rows.map((r) => r.filer_ref as string) } }, { anonId: { in: rows.map((r) => r.filer_ref as string) } }] } });
        const filerId = (ref: string) => filers.find((p) => p.externalId === ref || p.anonId === ref)?.id ?? null;
        await tx.complaint.createMany({
          data: rows.map((r) => ({
            leaderId: leaderId.get(r.leader_id as string)!,
            filedAt: new Date(r.date as string),
            filerRole: r.filer_role as string,
            filerRef: r.filer_ref as string,
            filerPersonId: filerId(r.filer_ref as string),
            text: r.text as string,
            importBatchId: b.id,
          })),
        });
        break;
      }
    }
    await audit({ actorUserId, action: "import.accepted", entityType: "ImportBatch", entityId: b.id, meta: { kind, rows: parsed.rows.length } }, tx);
    return b;
  });

  let message = `${parsed.rows.length} ${IMPORT_LABELS[kind].toLowerCase()} imported.`;
  if (kind === "complaints") {
    const r = await processNewComplaints(batch.id, actorUserId);
    message += ` ${r.compared} placed beside the documented record for the person who filed it.`;
    if (r.excluded) message += ` ${r.excluded} fell outside the Gap Reader.`;
    return { ok: true, batchId: batch.id, rows: parsed.rows.length, message: r.excluded ? `${message}\n${r.gateMessage}` : message };
  }
  return { ok: true, batchId: batch.id, rows: parsed.rows.length, message };
}
