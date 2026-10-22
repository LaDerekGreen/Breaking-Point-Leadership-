/** The Three Vantage Point Survey (Exercise 2), default instrument. */

export { SURVEY_STATEMENTS, OPEN_QUESTION, SCALE, selfStatement } from "@/lib/book/survey";

export const VANTAGES = [
  { value: "above", label: "Above: I am senior to this leader" },
  { value: "beside", label: "Beside: I am a peer of this leader" },
  { value: "below", label: "Below: I report to this leader, directly or indirectly" },
] as const;

export function validAnswers(a: unknown): a is number[] {
  return Array.isArray(a) && a.length === 8 && a.every((x) => Number.isInteger(x) && x >= 1 && x <= 5);
}
