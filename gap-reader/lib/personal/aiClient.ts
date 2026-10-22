import { createAIClient, type AIClient } from "@/lib/ai/adapter";
import { getRecord } from "./vaultClient";
import { IDS, type AISettings } from "./types";

/**
 * The user's own AI key, decrypted in the browser. Calls go from the browser
 * straight to the provider, so personal conversations never pass through
 * this app's server and the publisher carries no AI cost.
 */
export async function personalAI(key: CryptoKey): Promise<AIClient | null> {
  const s = await getRecord<AISettings>(key, "settings", IDS.settings);
  if (!s?.apiKey) return null;
  return createAIClient({ provider: s.provider, apiKey: s.apiKey, model: s.model, runtime: "browser" });
}
