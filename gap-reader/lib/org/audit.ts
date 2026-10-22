import "server-only";
import type { Prisma, PrismaClient } from "@/generated/org";
import { orgDb } from "./db";

type Tx = PrismaClient | Prisma.TransactionClient;

export type AuditEntry = {
  /** null for the deterministic system. The AI is never an actor. */
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  reason?: string | null;
  /** IDs, states and counts only. Never a finding's contents. */
  meta?: Prisma.InputJsonValue;
};

/** Every finding generated, report delivered, escalation step and human decision. */
export async function audit(entry: AuditEntry, tx: Tx = orgDb): Promise<void> {
  await tx.auditLog.create({
    data: {
      actorUserId: entry.actorUserId,
      actorKind: entry.actorUserId ? "human" : "system",
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      reason: entry.reason ?? null,
      meta: entry.meta ?? undefined,
    },
  });
}
