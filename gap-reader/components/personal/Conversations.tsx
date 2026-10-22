"use client";

import { useState } from "react";
import { Chat } from "./Chat";
import { useRecords } from "./hooks";
import type { Conversation, ConversationKind } from "@/lib/personal/types";
import { Button } from "@/components/ui";
import { deleteRecord } from "@/lib/personal/vaultClient";

/** Past conversations of one kind, and a new one built from the page's opening message. */
export function Conversations({ kind, title, system, opening, filter }: { kind: ConversationKind; title: string; system: string; opening: string | null; filter?: (c: Conversation) => boolean }) {
  const { items, reload } = useRecords<Conversation>("conversation");
  const [active, setActive] = useState<string | "new" | null>(null);
  const mine = (items ?? []).filter((c) => c.data.kind === kind && (!filter || filter(c.data)));
  const current = mine.find((c) => c.id === active);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => setActive("new")} disabled={!opening}>Start a new conversation</Button>
        {mine.length > 0 && (
          <label className="flex items-center gap-2 text-sm">
            <span>Or reopen</span>
            <select className="min-h-11 rounded-md border border-line bg-card px-2" value={current?.id ?? ""} onChange={(e) => setActive(e.target.value || null)}>
              <option value="">Choose…</option>
              {mine.map((c) => <option key={c.id} value={c.id}>{new Date(c.data.createdAt).toLocaleDateString()} · {c.data.title}{c.data.stopped ? " (stopped)" : ""}</option>)}
            </select>
          </label>
        )}
        {current && (
          <Button variant="danger" onClick={async () => { await deleteRecord(current.id); setActive(null); await reload(); }}>Delete this conversation</Button>
        )}
      </div>
      {active === "new" && opening && <Chat key={`new-${mine.length}`} kind={kind} title={title} system={system} opening={opening} />}
      {current && <Chat key={current.id} kind={kind} title={current.data.title} system={system} opening={opening ?? ""} existing={current} />}
    </div>
  );
}
