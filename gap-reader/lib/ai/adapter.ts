/**
 * The single, provider-agnostic AI adapter.
 *
 * Every AI call in Gap Reader goes through createAIClient(). It uses fetch
 * only, so the same code runs on the server (Organizational Gap Reader, with
 * the organization's key) and in the browser (Personal Gap Reader, with the
 * user's own key, so personal conversations never pass through this app's
 * server).
 *
 * The AI informs. It never decides. Nothing in the system takes an action on
 * the strength of an adapter response alone; see lib/org/escalation.ts.
 */

export type ProviderId = "anthropic" | "openai";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type AIConfig = {
  provider: ProviderId;
  apiKey: string;
  model?: string;
  /** "browser" adds the header a provider requires for direct browser calls. */
  runtime?: "server" | "browser";
  /** Injected in tests. */
  fetchImpl?: typeof fetch;
};

export type CompletionRequest = {
  system: string;
  messages: ChatMessage[];
  maxTokens?: number;
};

export interface AIClient {
  readonly provider: ProviderId;
  readonly model: string;
  complete(req: CompletionRequest): Promise<string>;
}

export class AIError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "AIError";
  }
}

/** Shown only on the adapter settings screens. */
export const PROVIDERS: Record<ProviderId, { label: string; defaultModel: string; keyHint: string }> = {
  anthropic: { label: "Anthropic API", defaultModel: "claude-opus-5-5", keyHint: "sk-ant-..." },
  openai: { label: "OpenAI API", defaultModel: "gpt-5", keyHint: "sk-..." },
};

export function isProviderId(v: unknown): v is ProviderId {
  return v === "anthropic" || v === "openai";
}

export function createAIClient(config: AIConfig): AIClient {
  if (!config.apiKey) throw new AIError("No AI key is configured.");
  const fetchImpl = config.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const model = config.model?.trim() || PROVIDERS[config.provider].defaultModel;
  switch (config.provider) {
    case "anthropic":
      return anthropicClient(config, model, fetchImpl);
    case "openai":
      return openaiClient(config, model, fetchImpl);
    default:
      throw new AIError("Unknown AI provider.");
  }
}

function anthropicClient(config: AIConfig, model: string, fetchImpl: typeof fetch): AIClient {
  return {
    provider: "anthropic",
    model,
    async complete({ system, messages, maxTokens = 1200 }) {
      const headers: Record<string, string> = {
        "content-type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
      };
      if (config.runtime === "browser") headers["anthropic-dangerous-direct-browser-access"] = "true";
      const res = await fetchImpl("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers,
        body: JSON.stringify({ model, max_tokens: maxTokens, system, messages }),
      });
      if (!res.ok) throw new AIError(await errorText(res), res.status);
      const data = (await res.json()) as { content?: { type: string; text?: string }[] };
      return (data.content ?? [])
        .filter((b) => b.type === "text")
        .map((b) => b.text ?? "")
        .join("")
        .trim();
    },
  };
}

function openaiClient(config: AIConfig, model: string, fetchImpl: typeof fetch): AIClient {
  return {
    provider: "openai",
    model,
    async complete({ system, messages, maxTokens = 1200 }) {
      const res = await fetchImpl("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${config.apiKey}` },
        body: JSON.stringify({
          model,
          max_completion_tokens: maxTokens,
          messages: [{ role: "system", content: system }, ...messages],
        }),
      });
      if (!res.ok) throw new AIError(await errorText(res), res.status);
      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      return (data.choices?.[0]?.message?.content ?? "").trim();
    },
  };
}

async function errorText(res: Response): Promise<string> {
  let detail = "";
  try {
    const body = (await res.json()) as { error?: { message?: string } | string };
    detail = typeof body.error === "string" ? body.error : body.error?.message ?? "";
  } catch {
    /* body was not JSON */
  }
  return `The AI provider returned ${res.status}${detail ? `: ${detail}` : "."}`;
}
