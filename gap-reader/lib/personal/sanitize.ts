/**
 * B2: people are described by role, and confidential details are left out.
 * Email addresses are stripped from input. Likely names produce a warning.
 */

const EMAIL = /[\w.+-]+@[\w-]+(\.[\w-]+)+/g;

export function stripEmails(text: string): string {
  return text.replace(EMAIL, "[email removed]");
}

const COMMON_CAPITALIZED = new Set(
  "I I'm I've I'd I'll Monday Tuesday Wednesday Thursday Friday Saturday Sunday January February March April May June July August September October November December CEO CFO COO CTO HR VP SVP EVP AI OK Q1 Q2 Q3 Q4 The A An My We Our He She They It This That When What Why How Who Then And But So If In On At For To Of".split(
    " ",
  ),
);

/** Capitalized words that are not at the start of a sentence and are not common words, plus titles. */
export function likelyNames(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(/\b(Mr|Mrs|Ms|Dr)\.?\s+[A-Z][a-z]+/g)) out.add(m[0]);
  for (const sentence of text.split(/[.!?\n]+/)) {
    const words = sentence.trim().split(/\s+/).filter(Boolean);
    words.slice(1).forEach((raw) => {
      const w = raw.replace(/[^A-Za-z']/g, "");
      if (/^[A-Z][a-z]+$/.test(w) && !COMMON_CAPITALIZED.has(w) && !/^(Mr|Mrs|Ms|Dr)$/.test(w)) out.add(w);
    });
  }
  return [...out];
}

export function nameWarning(text: string): string | null {
  const names = likelyNames(text);
  if (!names.length) return null;
  return `This looks like it may include a name (${names.slice(0, 3).join(", ")}). Describe people by role instead, such as "my newest analyst" or "my boss", and leave out confidential details.`;
}
