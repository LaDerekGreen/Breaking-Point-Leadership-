/**
 * The report a leader reads. Metrics in, plain description out, always
 * ending with the three questions. Without an AI key the report is written
 * from a fixed template, so the system works with no model at all.
 */

import type { AIClient } from "@/lib/ai/adapter";
import { ORG_REPORT_SYSTEM_PROMPT, THREE_QUESTIONS } from "@/lib/ai/prompts";
import type { Pattern } from "./patterns";

/** What the model receives: the pattern and its computed metrics, keyed by anonymous ID. */
export function reportInput(leaderAnonId: string, pattern: Pattern): string {
  return JSON.stringify(
    { leader: leaderAnonId, pattern: pattern.key, title: pattern.title, summary: pattern.summary, metrics: pattern.metrics },
    null,
    2,
  );
}

/** Guarantee the ending, whatever the model wrote. */
export function ensureThreeQuestions(text: string): string {
  let body = text.trim();
  for (const q of THREE_QUESTIONS) body = body.split(q).join("");
  body = body.replace(/\n{3,}/g, "\n\n").trim();
  return `${body}\n\n${THREE_QUESTIONS.join("\n")}`;
}

/** Words the report must never contain: no diagnosis, no discipline, no labels. */
const FORBIDDEN_IN_REPORT = /\b(diagnos\w*|disorder|narcissis\w*|toxic|abusive|bad leader|discipline|terminate|termination|fire (him|her|them)|demot\w*|put on (a )?pip|mood|anxious|depress\w*|mental health)\b/i;

export function reportIsClean(text: string): boolean {
  return !FORBIDDEN_IN_REPORT.test(text);
}

export function templateReport(pattern: Pattern): string {
  return ensureThreeQuestions(
    [
      `${pattern.title}.`,
      "",
      pattern.summary,
      "",
      "This finding was computed from records the organization already keeps. It is visible to you and to no one else. Nothing has entered your file, and no one above you has been told. Most findings like this one are ordinary, and many have context the record is missing. You have the full correction window to add that context, contest the finding, or record a plan.",
    ].join("\n"),
  );
}

export async function writeReport(leaderAnonId: string, pattern: Pattern, ai: AIClient | null): Promise<string> {
  if (!ai) return templateReport(pattern);
  const text = await ai.complete({
    system: ORG_REPORT_SYSTEM_PROMPT,
    messages: [{ role: "user", content: reportInput(leaderAnonId, pattern) }],
    maxTokens: 900,
  });
  const report = ensureThreeQuestions(text);
  // A report that drifts into diagnosis, labels or discipline is replaced by the template.
  return reportIsClean(report) && text.trim().length > 0 ? report : templateReport(pattern);
}
