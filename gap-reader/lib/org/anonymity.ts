/**
 * The anonymity threshold (A3). A hard rule, not a setting below eight.
 *
 * Any group (vantage point, job level, or any filter) with fewer respondents
 * than the threshold is merged into the next larger group before any result
 * is computed or displayed. If everything merged together is still below the
 * threshold, nothing is computed or displayed at all.
 */

export const ANONYMITY_FLOOR = 8;

/** The program lead may raise the threshold, never lower it below eight. */
export function effectiveThreshold(configured?: number | null): number {
  if (configured == null || !Number.isFinite(configured)) return ANONYMITY_FLOOR;
  return Math.max(ANONYMITY_FLOOR, Math.floor(configured));
}

/** Validates a requested change. Returns an error message, or null when allowed. */
export function validateThresholdChange(requested: number): string | null {
  if (!Number.isInteger(requested)) return "The threshold must be a whole number.";
  if (requested < ANONYMITY_FLOOR)
    return `The threshold can be raised but never set below ${ANONYMITY_FLOOR}.`;
  return null;
}

export type InputGroup<T> = { label: string; members: T[] };
export type MergedGroup<T> = { labels: string[]; label: string; members: T[] };

export type MergeResult<T> = {
  groups: MergedGroup<T>[];
  /** True when the whole population is below the threshold and nothing may be shown. */
  suppressed: boolean;
  threshold: number;
};

/**
 * Merge every group smaller than the threshold into the next larger group,
 * smallest first, until every remaining group meets the threshold.
 */
export function mergeSmallGroups<T>(input: InputGroup<T>[], configuredThreshold?: number | null): MergeResult<T> {
  const threshold = effectiveThreshold(configuredThreshold);
  let groups: MergedGroup<T>[] = input
    .filter((g) => g.members.length > 0)
    .map((g) => ({ labels: [g.label], label: g.label, members: [...g.members] }));

  const bySize = (a: MergedGroup<T>, b: MergedGroup<T>) =>
    a.members.length - b.members.length || a.label.localeCompare(b.label);

  for (;;) {
    groups.sort(bySize);
    if (groups.length === 0) return { groups: [], suppressed: true, threshold };
    const smallest = groups[0];
    if (smallest.members.length >= threshold) break;
    if (groups.length === 1) return { groups: [], suppressed: true, threshold };
    const next = groups[1];
    const labels = [...next.labels, ...smallest.labels];
    groups = [
      { labels, label: labels.join(" + "), members: [...next.members, ...smallest.members] },
      ...groups.slice(2),
    ];
  }

  // Final guarantee, whatever happened above.
  if (groups.some((g) => g.members.length < threshold)) return { groups: [], suppressed: true, threshold };
  return { groups, suppressed: false, threshold };
}

export function groupBy<T>(items: T[], key: (t: T) => string): InputGroup<T>[] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    map.set(k, [...(map.get(k) ?? []), item]);
  }
  return [...map.entries()].map(([label, members]) => ({ label, members }));
}

// ---------------------------------------------------------------------------
// Survey results and the gap
// ---------------------------------------------------------------------------

export type AnonymousResponse = {
  vantage: "above" | "beside" | "below";
  jobLevel?: string | null;
  answers: number[];
  comments?: string[];
  openAnswer?: string | null;
};

export type GroupResult = {
  label: string;
  labels: string[];
  n: number;
  averages: number[];
};

export type GapRow = {
  question: number; // 1 to 8
  group: string;
  self: number;
  others: number;
  gap: number; // others minus self
  aboveHighBelowLow: boolean;
};

export type SurveyResult = {
  threshold: number;
  suppressed: boolean;
  totalResponses: number;
  overall: GroupResult | null;
  groups: GroupResult[];
  gaps: GapRow[];
  /** Comments from groups that met the threshold, pooled and in a shuffled order. */
  comments: string[];
};

function averages(rs: AnonymousResponse[]): number[] {
  return Array.from({ length: 8 }, (_, q) => round2(rs.reduce((s, r) => s + r.answers[q], 0) / rs.length));
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Compute results for one leader. The leader's self rating is the leader's
 * own and is not part of any anonymous group. Nothing is computed for a group
 * until the threshold has been applied.
 */
export function computeSurveyResult(
  responses: AnonymousResponse[],
  selfRating: number[] | null,
  configuredThreshold?: number | null,
  by: "vantage" | "jobLevel" = "vantage",
  shuffle: <T>(xs: T[]) => T[] = shuffleArray,
): SurveyResult {
  const merged = mergeSmallGroups(
    groupBy(responses, (r) => (by === "vantage" ? r.vantage : r.jobLevel?.trim() || "not given")),
    configuredThreshold,
  );
  const empty: SurveyResult = {
    threshold: merged.threshold,
    suppressed: true,
    totalResponses: responses.length,
    overall: null,
    groups: [],
    gaps: [],
    comments: [],
  };
  if (merged.suppressed) return empty;

  const groups: GroupResult[] = merged.groups.map((g) => ({
    label: g.label,
    labels: g.labels,
    n: g.members.length,
    averages: averages(g.members),
  }));
  const overall: GroupResult = { label: "everyone", labels: ["everyone"], n: responses.length, averages: averages(responses) };

  const gaps: GapRow[] = [];
  if (selfRating && selfRating.length === 8) {
    const above = groups.find((g) => g.labels.length === 1 && g.labels[0] === "above");
    const below = groups.find((g) => g.labels.length === 1 && g.labels[0] === "below");
    for (let q = 0; q < 8; q++) {
      const flag = !!above && !!below && above.averages[q] >= 4 && below.averages[q] <= 2.5;
      for (const g of groups) {
        gaps.push({
          question: q + 1,
          group: g.label,
          self: selfRating[q],
          others: g.averages[q],
          gap: round2(g.averages[q] - selfRating[q]),
          aboveHighBelowLow: flag,
        });
      }
    }
    // Largest gaps first, and first of all where above rates high and below rates low.
    gaps.sort(
      (a, b) =>
        Number(b.aboveHighBelowLow) - Number(a.aboveHighBelowLow) ||
        Math.abs(b.gap) - Math.abs(a.gap) ||
        a.question - b.question,
    );
  }

  const comments = shuffle(
    merged.groups.flatMap((g) =>
      g.members.flatMap((r) => [...(r.comments ?? []), r.openAnswer ?? ""]).filter((c) => c && c.trim().length > 0),
    ),
  );

  return { threshold: merged.threshold, suppressed: false, totalResponses: responses.length, overall, groups, gaps, comments };
}

export function shuffleArray<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
