/**
 * The law-or-policy exclusion gate (A5).
 *
 * Runs before any finding is created and before any complaint is compared
 * with the record. Rules first, then a model check. If either says the
 * material may involve a violation of law or policy, the gate fires: no
 * finding is created, nothing is routed anywhere, the analysis is not
 * stored, and only the fact, the date and the record IDs are logged
 * (GateEvent). The program lead sees GATE_MESSAGE and nothing else.
 *
 * The gate returns a boolean only. It never says why, so there is nothing
 * to store and nothing to route. There is deliberately no investigation
 * workflow, case management, or routing to HR or counsel anywhere in this
 * codebase. Those live in the organization's own systems.
 */

import type { AIClient } from "@/lib/ai/adapter";
import { GATE_CHECK_SYSTEM_PROMPT } from "@/lib/ai/prompts";

export { GATE_MESSAGE } from "@/lib/ai/prompts";

/** Safety, discrimination, harassment, ethics, retaliation, and law. */
const RULES: RegExp[] = [
  // safety
  /\b(unsafe|safety|hazard\w*|injur\w*|accident\w*|osha|near[ -]?miss|lockout|fire exit|toxic|exposure)\b/i,
  // discrimination
  /\b(discriminat\w*|racis\w*|racial\w*|sexis\w*|ageis\w*|too old|pregnan\w*|disabilit\w*|religio\w*|ethnic\w*|national origin|gay|lesbian|lgbt\w*|transgender|gender identity|because of (my|her|his|their) (race|gender|sex|age|religion|disability))\b/i,
  // harassment
  /\b(harass\w*|sexual\w*|grop\w*|inappropriate(ly)? touch\w*|stalk\w*|threat\w*|intimidat\w*|hostile work|bully\w*|assault\w*|abus\w*)\b/i,
  // ethics and law
  /\b(fraud\w*|brib\w*|kickback\w*|embezzl\w*|falsif\w*|conflict of interest|illegal\w*|unlawful\w*|theft|steal\w*|stole|cover(ed|ing)?[ -]?up|ethic\w*|whistle[ -]?blow\w*|retaliat\w*|reprisal|lawsuit|attorney|lawyer|eeoc|labor board|unpaid (wages|overtime)|wage theft|violat\w*|compliance breach)\b/i,
];

export type GateInput = {
  /** Complaint text and any other free text in the material. */
  texts: string[];
  /** Count of evaluations that dropped within one cycle after the subject filed a formal concern. */
  retaliationSignals: number;
};

export function ruleCheck(input: GateInput): boolean {
  if (input.retaliationSignals > 0) return true;
  return input.texts.some((t) => RULES.some((r) => r.test(t)));
}

/**
 * Remove what could identify a person before any text reaches the model
 * check: email addresses, phone numbers, long digit runs, and capitalized
 * words that are not at the start of a sentence (likely names).
 */
export function redact(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, "[email]")
    .replace(/\+?\d[\d\s().-]{6,}\d/g, "[number]")
    .replace(/([^.!?\s]\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g, (_m, pre: string) => `${pre}[name]`);
}

export type GateResult = { fired: boolean };

/**
 * Rules plus a model check. If no AI key is configured, the rules decide
 * alone. If the model call fails, the caller receives the error and must not
 * create a finding (the analysis is retried later, never guessed).
 */
export async function runGate(input: GateInput, ai: AIClient | null): Promise<GateResult> {
  if (ruleCheck(input)) return { fired: true };
  if (!ai) return { fired: false };
  const material = [
    `Signals computed from the record: ${input.retaliationSignals} evaluation drops after formal concerns.`,
    ...input.texts.map((t, i) => `Text ${i + 1}: ${redact(t)}`),
  ].join("\n");
  const answer = await ai.complete({
    system: GATE_CHECK_SYSTEM_PROMPT,
    messages: [{ role: "user", content: material }],
    maxTokens: 5,
  });
  // Anything other than a clear NO fires the gate.
  return { fired: !/^\s*no\b/i.test(answer) };
}
