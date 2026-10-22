import { describe, expect, it } from "vitest";
import {
  ANONYMITY_FLOOR,
  computeSurveyResult,
  effectiveThreshold,
  mergeSmallGroups,
  validateThresholdChange,
  type AnonymousResponse,
} from "@/lib/org/anonymity";

const people = (n: number, label = "x") => Array.from({ length: n }, (_, i) => `${label}${i}`);
const resp = (vantage: AnonymousResponse["vantage"], n: number, answer = 3, jobLevel?: string): AnonymousResponse[] =>
  Array.from({ length: n }, () => ({ vantage, jobLevel, answers: Array(8).fill(answer), comments: [], openAnswer: null }));

describe("anonymity threshold", () => {
  it("is eight and can never be configured lower", () => {
    expect(ANONYMITY_FLOOR).toBe(8);
    expect(effectiveThreshold(undefined)).toBe(8);
    expect(effectiveThreshold(null)).toBe(8);
    expect(effectiveThreshold(5)).toBe(8);
    expect(effectiveThreshold(0)).toBe(8);
    expect(effectiveThreshold(-3)).toBe(8);
    expect(effectiveThreshold(Number.NaN)).toBe(8);
    expect(effectiveThreshold(7.9)).toBe(8);
  });

  it("can be raised", () => {
    expect(effectiveThreshold(12)).toBe(12);
    expect(validateThresholdChange(12)).toBeNull();
    expect(validateThresholdChange(8)).toBeNull();
  });

  it("rejects any change below eight", () => {
    for (const n of [7, 5, 1, 0, -1]) expect(validateThresholdChange(n)).toMatch(/never/);
    expect(validateThresholdChange(8.5)).toMatch(/whole/);
  });

  it("leaves groups at or above the threshold alone", () => {
    const r = mergeSmallGroups([{ label: "a", members: people(8) }, { label: "b", members: people(9) }], 8);
    expect(r.suppressed).toBe(false);
    expect(r.groups.map((g) => g.label).sort()).toEqual(["a", "b"]);
  });

  it("merges a small group into the next larger group", () => {
    const r = mergeSmallGroups(
      [
        { label: "above", members: people(1) },
        { label: "beside", members: people(9) },
        { label: "below", members: people(12) },
      ],
      8,
    );
    expect(r.suppressed).toBe(false);
    expect(r.groups).toHaveLength(2);
    const merged = r.groups.find((g) => g.labels.includes("above"))!;
    expect(merged.labels.sort()).toEqual(["above", "beside"]);
    expect(merged.members).toHaveLength(10);
    expect(r.groups.every((g) => g.members.length >= 8)).toBe(true);
  });

  it("keeps merging until every group meets the threshold", () => {
    const r = mergeSmallGroups(
      [
        { label: "a", members: people(2) },
        { label: "b", members: people(3) },
        { label: "c", members: people(4) },
        { label: "d", members: people(20) },
      ],
      8,
    );
    expect(r.suppressed).toBe(false);
    expect(r.groups.every((g) => g.members.length >= 8)).toBe(true);
    expect(r.groups.reduce((s, g) => s + g.members.length, 0)).toBe(29);
  });

  it("shows nothing when everyone together is below the threshold", () => {
    const r = mergeSmallGroups([{ label: "a", members: people(3) }, { label: "b", members: people(4) }], 8);
    expect(r.suppressed).toBe(true);
    expect(r.groups).toEqual([]);
  });

  it("uses the floor even when a lower threshold is passed in", () => {
    const r = mergeSmallGroups([{ label: "a", members: people(5) }, { label: "b", members: people(6) }], 3);
    expect(r.threshold).toBe(8);
    expect(r.groups).toHaveLength(1);
    expect(r.groups[0].members).toHaveLength(11);
  });

  it("honours a raised threshold", () => {
    const r = mergeSmallGroups([{ label: "a", members: people(9) }, { label: "b", members: people(9) }], 10);
    expect(r.groups).toHaveLength(1);
  });

  it("never computes a result for a group below the threshold, whatever the filter", () => {
    const responses = [...resp("above", 2, 5, "L1"), ...resp("beside", 3, 4, "L2"), ...resp("below", 7, 1, "L3")];
    for (const by of ["vantage", "jobLevel"] as const) {
      const r = computeSurveyResult(responses, Array(8).fill(4), 8, by);
      expect(r.suppressed).toBe(false);
      expect(r.groups.every((g) => g.n >= 8)).toBe(true);
    }
  });

  it("suppresses everything, including comments, below the threshold", () => {
    const responses = resp("below", 7, 2).map((r) => ({ ...r, openAnswer: "a comment" }));
    const r = computeSurveyResult(responses, Array(8).fill(4), 8);
    expect(r.suppressed).toBe(true);
    expect(r.groups).toEqual([]);
    expect(r.gaps).toEqual([]);
    expect(r.comments).toEqual([]);
    expect(r.overall).toBeNull();
  });

  it("reports the largest gaps first, above high and below low before anything else", () => {
    const responses = [
      ...resp("above", 8, 5),
      ...resp("beside", 8, 3),
      ...resp("below", 8, 2),
    ];
    const self = [5, 5, 5, 5, 5, 5, 5, 1];
    const r = computeSurveyResult(responses, self, 8);
    expect(r.gaps[0].aboveHighBelowLow).toBe(true);
    expect(r.gaps[0]).toMatchObject({ question: 8, group: "above", gap: 4 });
    expect(r.gaps.find((g) => g.group === "below" && g.question === 1)!.gap).toBe(-3);
    // Where above is high and below is low comes before a larger gap that lacks that shape.
    const mixed = computeSurveyResult([...resp("above", 8, 3), ...resp("beside", 8, 3), ...resp("below", 8, 3)], [1, 3, 3, 3, 3, 3, 3, 3], 8);
    expect(mixed.gaps.every((g) => !g.aboveHighBelowLow)).toBe(true);
    const unflagged = r.gaps.filter((g) => !g.aboveHighBelowLow);
    for (let i = 1; i < unflagged.length; i++) expect(Math.abs(unflagged[i - 1].gap)).toBeGreaterThanOrEqual(Math.abs(unflagged[i].gap));
  });
});
