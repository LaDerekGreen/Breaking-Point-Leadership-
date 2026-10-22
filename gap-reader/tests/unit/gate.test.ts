import { describe, expect, it } from "vitest";
import { GATE_MESSAGE, redact, ruleCheck, runGate } from "@/lib/org/gate";
import type { AIClient } from "@/lib/ai/adapter";
import { computeMetrics } from "@/lib/org/metrics";
import * as fs from "node:fs";
import * as path from "node:path";

const ai = (answer: string): AIClient & { calls: string[] } => {
  const calls: string[] = [];
  return { provider: "anthropic", model: "test", calls, async complete(r) { calls.push(r.messages[0].content); return answer; } };
};

describe("law-or-policy exclusion gate", () => {
  it("has the fixed message", () => {
    expect(GATE_MESSAGE).toBe("This may involve a violation of law or policy. It falls outside the Gap Reader and is handled under the organization's own policies.");
  });

  it.each([
    "There was an injury on the line and the guard was removed.",
    "I believe I was passed over because of my age; he says I am too old.",
    "He keeps making sexual jokes about the new analyst.",
    "She asked us to falsify the inventory count.",
    "After I raised it, I faced retaliation.",
    "This is discrimination.",
    "My manager is harassing me.",
    "The unsafe scaffolding was never fixed.",
  ])("fires on: %s", (text) => {
    expect(ruleCheck({ texts: [text], retaliationSignals: 0 })).toBe(true);
  });

  it("fires on a retaliation signal in the metrics: an evaluation drop after a formal concern", () => {
    const m = computeMetrics({
      leaderAnonId: "L", asOf: new Date("2026-06-01"), decisions: [], promotions: [], stretch: [], surveys: [],
      complaints: [{ id: "c1", filerRef: "S1", filedAt: new Date("2025-06-01") }],
      evaluations: [
        { subjectRef: "S1", evaluatedAt: new Date("2025-01-01"), rating: 4 },
        { subjectRef: "S1", evaluatedAt: new Date("2025-12-01"), rating: 2 },
      ],
    });
    expect(m.evaluationAfterConcern.drops).toBe(1);
    expect(ruleCheck({ texts: [], retaliationSignals: m.evaluationAfterConcern.drops })).toBe(true);
  });

  it("lets an ordinary performance complaint through the rules", () => {
    expect(ruleCheck({ texts: ["Status meetings run long and decisions are made before we finish presenting."], retaliationSignals: 0 })).toBe(false);
  });

  it("asks the model when the rules pass, with names and emails removed", async () => {
    const yes = ai("YES");
    expect((await runGate({ texts: ["Meetings with Dana Whitfield run long. Email dana@example.org."], retaliationSignals: 0 }, yes)).fired).toBe(true);
    expect(yes.calls[0]).not.toContain("Dana");
    expect(yes.calls[0]).not.toContain("dana@example.org");
    const no = ai("NO");
    expect((await runGate({ texts: ["Meetings run long."], retaliationSignals: 0 }, no)).fired).toBe(false);
  });

  it("treats anything but a clear NO from the model as firing", async () => {
    expect((await runGate({ texts: ["Meetings run long."], retaliationSignals: 0 }, ai("Possibly."))).fired).toBe(true);
    expect((await runGate({ texts: ["Meetings run long."], retaliationSignals: 0 }, ai(""))).fired).toBe(true);
  });

  it("returns only a boolean, so there is no analysis to store", async () => {
    const r = await runGate({ texts: ["harassment"], retaliationSignals: 0 }, null);
    expect(Object.keys(r)).toEqual(["fired"]);
  });

  it("redacts identifying details", () => {
    expect(redact("I spoke with Morgan Lee at 555-201-3344 and morgan@x.org")).toBe("I spoke with [name] at [number] and [email]");
  });

  it("the codebase has no investigation, case management or routing to HR or counsel", () => {
    const roots = ["app", "lib", "prisma"];
    const files: string[] = [];
    const walk = (d: string) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.(ts|tsx|prisma)$/.test(e.name)) files.push(p);
      }
    };
    roots.forEach((r) => fs.existsSync(r) && walk(r));
    const banned = /\b(model\s+(Case|Investigation|Escalation(To)?Hr|Referral)\b|routeTo(HR|Hr|Counsel|Legal)|sendTo(HR|Hr|Counsel|Legal)|createCase|openInvestigation)/;
    for (const f of files) expect(banned.test(fs.readFileSync(f, "utf8")), f).toBe(false);
  });
});
