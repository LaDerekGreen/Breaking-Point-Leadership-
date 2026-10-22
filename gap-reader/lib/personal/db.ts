import "server-only";
import { PrismaClient } from "@/generated/personal";

/**
 * The Personal Gap Reader's only database client. It connects with the
 * gr_personal role, which has no access to the org schema. It stores
 * ciphertext only.
 */
const g = globalThis as unknown as { __grPersonalDb?: PrismaClient };
export const personalDb: PrismaClient = g.__grPersonalDb ?? new PrismaClient({ datasourceUrl: process.env.PERSONAL_DATABASE_URL });
if (process.env.NODE_ENV !== "production") g.__grPersonalDb = personalDb;
