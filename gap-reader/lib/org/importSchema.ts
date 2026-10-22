/**
 * What the system may ingest (A2), enforced at the schema level.
 *
 * Each import kind has a fixed list of columns. A file is rejected whole if
 * any column is not on the list, and rejected with a stronger message if any
 * column is named or resembles email bodies, chat logs, location, health,
 * medical, mood, or personal life. Names are rejected too: people appear in
 * records by role and anonymous ID only. Every rejection is logged.
 *
 * Adding a data source not listed here needs the book owner's approval first.
 */

import { z } from "zod";

export const IMPORT_KINDS = ["decisions", "promotions", "evaluations", "stretch", "complaints"] as const;
export type ImportKind = (typeof IMPORT_KINDS)[number];

export const IMPORT_LABELS: Record<ImportKind, string> = {
  decisions: "Decision records",
  promotions: "Promotion system of record",
  evaluations: "Evaluations",
  stretch: "Stretch assignments",
  complaints: "Formal performance complaints about a leader",
};

/** Patterns for fields that are never read. Matched against normalized column names. */
export const FORBIDDEN_FIELD_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: "email", pattern: /e?mail|inbox|subject_?line/ },
  { label: "chat or messages", pattern: /chat|slack|teams_?msg|message|msg|dm$|^dm|sms|whatsapp|transcript|conversation/ },
  { label: "message body", pattern: /^body$|_body$|body_|content$/ },
  { label: "location", pattern: /location|gps|latitude|longitude|^lat$|^lng$|^lon$|geo|address|home_?town|zip|postcode|badge_?swipe|ip_?addr/ },
  { label: "health or medical", pattern: /health|medical|medic|diagnos|illness|sick|disab|symptom|prescription|medication|therapy|doctor|leave_?reason|fmla/ },
  { label: "mood or sentiment", pattern: /mood|sentiment|emotion|feeling|stress|wellbeing|well_?being|mental|happiness|burnout|engagement_?score|tone/ },
  { label: "personal life", pattern: /personal|private|family|spouse|partner|marital|child|relationship|religio|politic|social_?media|off_?hours|after_?hours|weekend/ },
  { label: "monitoring", pattern: /keystroke|screen_?shot|webcam|camera|voice|face|calendar|productivity|activity_?log|idle/ },
  { label: "a person's name", pattern: /(^|_)(first|last|full|given|family|display|employee|candidate|recipient|filer)?_?name$/ },
];

const iso = z.string().trim().refine((s) => !Number.isNaN(Date.parse(s)), "must be a date");
const optIso = z.union([z.literal(""), iso]).optional();
const optStr = z.string().trim().optional();
const req = z.string().trim().min(1, "is required");
const rating = z.coerce.number().min(0).max(10);

export const ROW_SCHEMAS = {
  decisions: z.object({
    leader_id: req,
    type: req,
    date: iso,
    requested_at: optIso,
    affected_role: req,
    documented_reason: z.string().trim(),
    alternatives_considered: z.string().trim(),
    outcome: z.enum(["", "accepted", "dismissed", "deferred", "approved", "declined"]).optional(),
    shift: optStr,
    team: optStr,
    tenure_band: optStr,
    minutes_before_opinion: z.union([z.literal(""), z.coerce.number().int().min(0)]).optional(),
  }),
  promotions: z.object({
    subject_ref: req,
    candidate_role: req,
    approval_date: iso,
    effective_date: iso,
  }),
  evaluations: z.object({
    leader_id: req,
    subject_ref: req,
    date: iso,
    rating,
    commitment: optStr,
    commitment_type: z.enum(["", "promotion", "development", "culture", "other"]).optional(),
    commitment_due: optIso,
    survey_item: z.union([z.literal(""), z.coerce.number().int().min(1).max(8)]).optional(),
  }),
  stretch: z.object({
    leader_id: req,
    date: iso,
    recipient_role: req,
    recipient_ref: optStr,
    tenure_band: req,
    result_rating: z.union([z.literal(""), rating]).optional(),
  }),
  complaints: z.object({
    leader_id: req,
    date: iso,
    filer_role: req,
    filer_ref: req,
    text: req,
  }),
} as const;

export const ALLOWED_COLUMNS: Record<ImportKind, string[]> = Object.fromEntries(
  IMPORT_KINDS.map((k) => [k, Object.keys(ROW_SCHEMAS[k].shape)]),
) as Record<ImportKind, string[]>;

export function normalizeColumn(name: string): string {
  return name
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export type HeaderCheck =
  | { ok: true; columns: string[] }
  | { ok: false; forbidden: { column: string; label: string }[]; unknown: string[]; missing: string[] };

/** Schema-level check of a file's columns, before any row is read. */
export function checkHeaders(kind: ImportKind, headers: string[]): HeaderCheck {
  const allowed = new Set(ALLOWED_COLUMNS[kind]);
  const forbidden: { column: string; label: string }[] = [];
  const unknown: string[] = [];
  const cols = headers.map(normalizeColumn);
  for (const col of cols) {
    const hit = FORBIDDEN_FIELD_PATTERNS.find((f) => f.pattern.test(col));
    // The allowed list is checked first so "documented_reason" style fields pass,
    // but a forbidden pattern on an allowed name would be a bug in this file.
    if (allowed.has(col)) continue;
    if (hit) forbidden.push({ column: col, label: hit.label });
    else unknown.push(col);
  }
  const shape = ROW_SCHEMAS[kind].shape as Record<string, z.ZodTypeAny>;
  const missing = Object.entries(shape)
    .filter(([k, s]) => !s.isOptional() && !cols.includes(k))
    .map(([k]) => k);
  if (forbidden.length || unknown.length || missing.length) return { ok: false, forbidden, unknown, missing };
  return { ok: true, columns: cols };
}

export type RowError = { row: number; message: string };

export function parseRows<K extends ImportKind>(
  kind: K,
  rows: Record<string, string>[],
): { ok: true; rows: z.infer<(typeof ROW_SCHEMAS)[K]>[] } | { ok: false; errors: RowError[] } {
  const schema = ROW_SCHEMAS[kind];
  const out: z.infer<(typeof ROW_SCHEMAS)[K]>[] = [];
  const errors: RowError[] = [];
  rows.forEach((raw, i) => {
    const normalized = Object.fromEntries(Object.entries(raw).map(([k, v]) => [normalizeColumn(k), v ?? ""]));
    const parsed = schema.safeParse(normalized);
    if (parsed.success) out.push(parsed.data as z.infer<(typeof ROW_SCHEMAS)[K]>);
    else
      errors.push({
        row: i + 2,
        message: parsed.error.issues.map((iss) => `${iss.path.join(".")} ${iss.message}`).join("; "),
      });
  });
  return errors.length ? { ok: false, errors } : { ok: true, rows: out };
}
