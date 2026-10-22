/** The Three Vantage Point Survey (Exercise 2), default instrument. */

export const SURVEY_STATEMENTS = [
  "This leader asks questions before giving an opinion.",
  "I can bring this leader bad news without worrying about how it will affect me.",
  "When this leader is under pressure, I can still predict how they will react.",
  "This leader explains the reasoning behind decisions that affect me.",
  "Assignments and opportunities from this leader are fairly distributed.",
  "This leader follows through on commitments they make to me.",
  "When I disagree with this leader, my view is considered seriously.",
  "This leader develops people for their next role, not only for their current one.",
] as const;

export const OPEN_QUESTION = "What does this leader do that makes it harder for you to tell them the truth?";

export const SCALE = [
  { value: 1, label: "Strongly disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neither agree nor disagree" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly agree" },
] as const;

export const VANTAGES = [
  { value: "above", label: "Above: I am senior to this leader" },
  { value: "beside", label: "Beside: I am a peer of this leader" },
  { value: "below", label: "Below: I report to this leader, directly or indirectly" },
] as const;

/** The leader rates themselves on the same statements, in the first person. */
export function selfStatement(s: string): string {
  return s
    .replace(/^This leader /, "I ")
    .replace(/^I can bring this leader bad news without worrying about how it will affect me\.$/, "People can bring me bad news without worrying about how it will affect them.")
    .replace(/^When this leader is under pressure, I can still predict how they will react\.$/, "When I am under pressure, people can still predict how I will react.")
    .replace(/^Assignments and opportunities from this leader are fairly distributed\.$/, "The assignments and opportunities I give are fairly distributed.")
    .replace(/^When I disagree with this leader, my view is considered seriously\.$/, "When people disagree with me, I consider their view seriously.")
    .replace(/commitments they make to me/, "commitments I make to people")
    .replace(/decisions that affect me/, "decisions that affect people")
    .replace(/^I asks /, "I ask ")
    .replace(/^I explains /, "I explain ")
    .replace(/^I follows /, "I follow ")
    .replace(/^I develops /, "I develop ");
}

export function validAnswers(a: unknown): a is number[] {
  return Array.isArray(a) && a.length === 8 && a.every((x) => Number.isInteger(x) && x >= 1 && x <= 5);
}
