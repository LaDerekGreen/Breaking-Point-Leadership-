import type { ChatMessage, ProviderId } from "@/lib/ai/adapter";

export type AISettings = { provider: ProviderId; apiKey: string; model?: string };
export type Profile = { values: string; breakingPoint: string; createdAt: string };
export type LogEntry = {
  date: string;
  decision: string;
  affected: string;
  pressure: string;
  questions: string;
  alternatives: string;
  createdAt: string;
};
export type Commitment = { text: string; measure: string; who: string };
export type Plan = { breakingPoint: string; commitments: Commitment[]; weeksDone: number[]; startedAt: string };
export type WorkbookEntry = { exerciseId: number; answers: Record<string, string>; selfRating?: number[]; updatedAt: string };
export type Inquiry = {
  words: string[];
  sources: { word: string; who: string; did: string }[];
  decisions: { decision: string; felt: string; sentence: string }[];
  card: string;
  updatedAt: string;
};
export type ConversationKind = "reader" | "checkin" | "readback" | "inquiry" | "workbook";
export type Conversation = { kind: ConversationKind; title: string; messages: ChatMessage[]; stopped: boolean; createdAt: string };

export const MAX_COMMITMENTS = 3;

/** Fixed record IDs for single records. */
export const IDS = { settings: "settings-ai", profile: "profile-main", plan: "plan-ninety", inquiry: "inquiry-source" } as const;
