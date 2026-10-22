import "server-only";
import { PrismaClient } from "@/generated/org";

/**
 * The Organizational Gap Reader's only database client. It connects with the
 * gr_org role, which has no access to the personal schema. There is no import
 * of the personal client anywhere under lib/org or app/org (tested).
 */
const g = globalThis as unknown as { __grOrgDb?: PrismaClient };
export const orgDb: PrismaClient = g.__grOrgDb ?? new PrismaClient({ datasourceUrl: process.env.ORG_DATABASE_URL });
if (process.env.NODE_ENV !== "production") g.__grOrgDb = orgDb;
