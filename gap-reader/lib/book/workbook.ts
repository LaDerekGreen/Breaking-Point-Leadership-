/**
 * The Breaking Point Workbook, as text from the book (V28). The JSON is
 * extracted from the companion app's content.js so the wording stays the
 * book's own.
 */
import data from "./workbook.data.json";

export type WorkbookField = { key: string; label: string; rows?: number; type?: "text" };
export type Exercise = {
  id: number;
  title: string;
  time: string;
  body: string[];
  list?: string[];
  after?: string[];
  weeks?: string[];
  fields: WorkbookField[];
  howIShare?: { title: string; body: string; fields: WorkbookField[] };
  /** Exercise 2 in the Personal Gap Reader is a self rating only. */
  selfRatingOnly?: boolean;
};

export const WORKBOOK = data as { title: string; intro: string[]; finalWord: string[]; exercises: Exercise[] };

// In the personal tool, the Three Vantage Point Survey is a self rating only.
// The organizational tool runs the real survey.
const two = WORKBOOK.exercises.find((e) => e.id === 2)!;
two.selfRatingOnly = true;
two.fields = [{ key: "expect", label: "Where I expect the people above, beside and below me to see me differently than I see myself", rows: 4 }];

export function exercise(id: number): Exercise | undefined {
  return WORKBOOK.exercises.find((e) => e.id === id);
}

/** Plain text of an exercise and the user's answers, for sending to the AI one exercise at a time. */
export function exerciseAsText(e: Exercise, answers: Record<string, string>, selfRating?: number[], statements?: readonly string[]): string {
  const parts = [`Exercise ${e.id}: ${e.title}`, e.time, "", ...e.body];
  if (e.list?.length) parts.push("", ...e.list.map((l) => `- ${l}`));
  if (e.after?.length) parts.push("", ...e.after);
  if (selfRating && statements) parts.push("", "My self rating, 1 (strongly disagree) to 5 (strongly agree):", ...statements.map((s, i) => `${i + 1}. ${s} ${selfRating[i] ?? "not answered"}`));
  const fields = [...e.fields, ...(e.howIShare?.fields ?? [])];
  if (fields.length) parts.push("", "My answers so far:", ...fields.map((f) => `${f.label}: ${answers[f.key]?.trim() || "(blank)"}`));
  return parts.join("\n");
}
