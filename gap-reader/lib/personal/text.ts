import type { LogEntry, Plan } from "./types";

export function logAsText(entries: LogEntry[]): string {
  return entries
    .map((e, i) =>
      [
        `${i + 1}. ${e.date}: ${e.decision}`,
        `   Who it affected (role): ${e.affected || "not noted"}`,
        `   Pressure I was under: ${e.pressure || "not noted"}`,
        `   Questions I asked first: ${e.questions || "none noted"}`,
        `   Alternatives I considered: ${e.alternatives || "none noted"}`,
      ].join("\n"),
    )
    .join("\n");
}

export function planAsText(p: Plan | null | undefined): string {
  if (!p) return "(No ninety day plan yet.)";
  return [
    `My breaking point: ${p.breakingPoint || "(not written yet)"}`,
    ...p.commitments.map((c, i) => `Commitment ${i + 1}: ${c.text}\n   Measure: ${c.measure}\n   Who will hold me to it (role): ${c.who}`),
    `Started ${p.startedAt.slice(0, 10)}. Weeks done: ${p.weeksDone.length} of 13.`,
  ].join("\n");
}

export function inLastDays(entries: { data: LogEntry }[], days: number): LogEntry[] {
  const since = Date.now() - days * 86400000;
  return entries.map((e) => e.data).filter((e) => new Date(e.date).getTime() >= since).sort((a, b) => a.date.localeCompare(b.date));
}
