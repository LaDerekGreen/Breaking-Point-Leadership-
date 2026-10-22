import { describe, expect, it } from "vitest";
import { ALLOWED_COLUMNS, checkHeaders, FORBIDDEN_FIELD_PATTERNS, IMPORT_KINDS, parseRows } from "@/lib/org/importSchema";

describe("import schema (A2)", () => {
  it("no allowed column resembles a forbidden field", () => {
    for (const k of IMPORT_KINDS)
      for (const c of ALLOWED_COLUMNS[k]) expect(FORBIDDEN_FIELD_PATTERNS.some((f) => f.pattern.test(c)), `${k}.${c}`).toBe(false);
  });

  it.each([
    ["email_body", "email"],
    ["EmailText", "email"],
    ["chat_log", "chat or messages"],
    ["slack_messages", "chat or messages"],
    ["gps_location", "location"],
    ["Latitude", "location"],
    ["health_notes", "health or medical"],
    ["medical_leave", "health or medical"],
    ["mood_score", "mood or sentiment"],
    ["sentiment", "mood or sentiment"],
    ["personal_life_notes", "personal life"],
    ["family_status", "personal life"],
    ["employee_name", "a person's name"],
    ["keystrokes", "monitoring"],
  ])("rejects %s as %s", (col, label) => {
    const r = checkHeaders("decisions", ["leader_id", "type", "date", "affected_role", "documented_reason", "alternatives_considered", col]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.forbidden[0]?.label).toBe(label);
  });

  it("rejects unknown columns and missing required columns", () => {
    const r = checkHeaders("promotions", ["subject_ref", "candidate_role", "approval_date", "favorite_color"]);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.unknown).toEqual(["favorite_color"]);
      expect(r.missing).toEqual(["effective_date"]);
    }
  });

  it("accepts a clean file and validates rows", () => {
    const h = checkHeaders("promotions", ["Subject Ref", "candidate_role", "approval_date", "effective_date"]);
    expect(h.ok).toBe(true);
    const ok = parseRows("promotions", [{ "Subject Ref": "S-1", candidate_role: "Analyst II", approval_date: "2026-01-02", effective_date: "2026-02-01" }]);
    expect(ok.ok).toBe(true);
    const bad = parseRows("promotions", [{ subject_ref: "S-1", candidate_role: "", approval_date: "nope", effective_date: "2026-02-01" }]);
    expect(bad.ok).toBe(false);
  });
});
