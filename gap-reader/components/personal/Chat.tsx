"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/ai/adapter";
import { personalAI } from "@/lib/personal/aiClient";
import { indicatesCrisis } from "@/lib/personal/crisis";
import { nameWarning, stripEmails } from "@/lib/personal/sanitize";
import { newId, saveRecord } from "@/lib/personal/vaultClient";
import type { Conversation, ConversationKind } from "@/lib/personal/types";
import { useKey } from "./VaultProvider";
import { CrisisNotice } from "./Caution";
import { Button, Card, Textarea } from "@/components/ui";

/**
 * A conversation with the user's own AI key. The first user message is
 * prepared by the page (an exercise, the week's log, a Source Inquiry).
 * If the input or a response indicates crisis, the 988 and 911 notice goes
 * above the response and the session stops asking questions.
 */
export function Chat({
  kind,
  title,
  system,
  opening,
  existing,
}: {
  kind: ConversationKind;
  title: string;
  system: string;
  opening: string;
  existing?: { id: string; data: Conversation };
}) {
  const key = useKey();
  const [id] = useState(() => existing?.id ?? newId());
  const [messages, setMessages] = useState<ChatMessage[]>(existing?.data.messages ?? []);
  const [stopped, setStopped] = useState(existing?.data.stopped ?? false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [hasAI, setHasAI] = useState<boolean | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    personalAI(key).then((c) => setHasAI(!!c), () => setHasAI(false));
  }, [key]);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), [messages.length]);

  async function persist(next: ChatMessage[], stop: boolean) {
    const conv: Conversation = { kind, title, messages: next, stopped: stop, createdAt: existing?.data.createdAt ?? new Date().toISOString() };
    await saveRecord(key, "conversation", id, conv);
  }

  async function send(text: string) {
    const clean = stripEmails(text).trim();
    if (!clean || stopped) return;
    setErr(null);
    const next: ChatMessage[] = [...messages, { role: "user", content: clean }];
    setMessages(next);
    setDraft("");
    if (indicatesCrisis(clean)) {
      setStopped(true);
      await persist(next, true);
      return;
    }
    setBusy(true);
    try {
      const ai = await personalAI(key);
      if (!ai) throw new Error("Add your own AI key in Settings to talk with the Gap Reader.");
      const reply = await ai.complete({ system, messages: next, maxTokens: 1500 });
      const withReply: ChatMessage[] = [...next, { role: "assistant", content: reply }];
      const crisis = indicatesCrisis(reply);
      setMessages(withReply);
      if (crisis) setStopped(true);
      await persist(withReply, crisis);
    } catch (e) {
      setErr((e as Error).message);
      await persist(next, false);
    } finally {
      setBusy(false);
    }
  }

  const warn = nameWarning(draft);
  const started = messages.length > 0;

  return (
    <section aria-label={title} className="space-y-4">
      {stopped && <CrisisNotice />}
      {hasAI === false && (
        <Card tone="warn">
          This needs your own AI key. <Link href="/personal/settings">Add it in Settings</Link>. Your key is encrypted under your passphrase and used only from this browser.
        </Card>
      )}
      <ol className="space-y-3" aria-live="polite">
        {messages.map((m, i) => (
          <li key={i} className={`rounded-lg border p-4 ${m.role === "user" ? "border-line bg-card" : "border-accent/40 bg-accent-soft"}`}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{m.role === "user" ? "You" : "Gap Reader"}</p>
            <div className="whitespace-pre-line">{m.content}</div>
          </li>
        ))}
      </ol>
      <div ref={endRef} />
      {err && <p role="alert" className="text-danger">{err}</p>}
      {!stopped && !started && (
        <Card>
          <details>
            <summary className="cursor-pointer font-medium">What will be sent</summary>
            <pre className="mt-2 whitespace-pre-wrap text-sm">{opening}</pre>
          </details>
          <div className="mt-3"><Button onClick={() => send(opening)} disabled={busy || hasAI === false}>{busy ? "Waiting…" : "Begin"}</Button></div>
        </Card>
      )}
      {!stopped && started && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(draft);
          }}
          className="space-y-2"
        >
          <label htmlFor={`reply-${id}`} className="font-medium">Your answer</label>
          <Textarea id={`reply-${id}`} value={draft} onChange={(e) => setDraft(e.target.value)} rows={4} aria-describedby={warn ? `warn-${id}` : undefined} />
          {warn && <p id={`warn-${id}`} className="text-sm text-warn">{warn}</p>}
          <p className="text-xs text-muted">Describe people by role, not name. Leave out confidential details. Email addresses are removed before sending.</p>
          <Button type="submit" disabled={busy || !draft.trim()}>{busy ? "Waiting…" : "Send"}</Button>
        </form>
      )}
    </section>
  );
}
