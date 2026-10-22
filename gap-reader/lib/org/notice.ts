import "server-only";
import { orgDb } from "./db";

/** A1 default Notice text. Editable by the program lead. */
export const DEFAULT_NOTICE = {
  reads: [
    "Documented decisions: promotions, assignments, evaluations, approvals, and the reasons recorded for them.",
    "Anonymous climate survey trends, combined so that results are never reported for any group smaller than eight people.",
    "Written commitments leaders made, checked against what the record later shows.",
  ].join("\n"),
  neverReads: [
    "It never reads email, chat, or personal messages.",
    "It never tracks anyone off the job.",
    "It never scores anyone's mood, health, or private life.",
    "It never makes a decision about any person.",
    "Every finding goes first, privately, to the leader it concerns.",
    "Anything that may involve a violation of law or policy falls outside the Gap Reader and is handled under the organization's own policies.",
  ].join("\n"),
};

export async function currentNotice() {
  return orgDb.notice.findFirst({ where: { publishedAt: { not: null } }, orderBy: { version: "desc" } });
}

export async function draftNotice() {
  return orgDb.notice.findFirst({ where: { publishedAt: null }, orderBy: { version: "desc" } });
}

export async function hasAcknowledgedCurrent(userId: string): Promise<boolean> {
  const n = await currentNotice();
  if (!n) return false;
  const ack = await orgDb.noticeAcknowledgment.findUnique({ where: { userId_noticeId: { userId, noticeId: n.id } } });
  return !!ack;
}

/** User IDs who have acknowledged the current Notice. Only they may appear in a report. */
export async function acknowledgedUserIds(): Promise<Set<string>> {
  const n = await currentNotice();
  if (!n) return new Set();
  const acks = await orgDb.noticeAcknowledgment.findMany({ where: { noticeId: n.id }, select: { userId: true } });
  return new Set(acks.map((a) => a.userId));
}

export function lines(text: string): string[] {
  return text.split("\n").map((l) => l.trim()).filter(Boolean);
}
