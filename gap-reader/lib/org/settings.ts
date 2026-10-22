import "server-only";
import { orgDb } from "./db";
import { open } from "./secretbox";
import { createAIClient, isProviderId, type AIClient } from "@/lib/ai/adapter";
import { effectiveThreshold } from "./anonymity";
import { effectiveWindowDays } from "./escalation";

export async function getSettings() {
  const s = await orgDb.orgSettings.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });
  return {
    ...s,
    anonymityThreshold: effectiveThreshold(s.anonymityThreshold),
    correctionWindowDays: effectiveWindowDays(s.correctionWindowDays),
    hasAiKey: !!s.aiKeyCiphertext,
  };
}

/** The organization's own AI key, or null. The AI informs; it never decides. */
export async function orgAIClient(): Promise<AIClient | null> {
  const s = await orgDb.orgSettings.findUnique({ where: { id: 1 } });
  if (!s?.aiKeyCiphertext || !isProviderId(s.aiProvider)) return null;
  return createAIClient({ provider: s.aiProvider, apiKey: open(s.aiKeyCiphertext), model: s.aiModel ?? undefined, runtime: "server" });
}
