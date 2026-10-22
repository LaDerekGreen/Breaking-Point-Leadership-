"use client";

import { useCallback, useEffect, useState } from "react";
import { listRecords, saveRecord, type Stored } from "@/lib/personal/vaultClient";
import { useVault } from "./VaultProvider";

export function useRecords<T>(kind: string) {
  const { key } = useVault();
  const [items, setItems] = useState<Stored<T>[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    if (!key) return;
    try {
      setItems(await listRecords<T>(key, kind));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [key, kind]);
  useEffect(() => {
    void reload();
  }, [reload]);
  return { items, error, reload };
}

export function useRecord<T>(kind: string, id: string) {
  const { key } = useVault();
  const { items, error, reload } = useRecords<T>(kind);
  const value = items ? items.find((i) => i.id === id)?.data ?? null : undefined;
  const save = useCallback(
    async (data: T) => {
      if (!key) throw new Error("Locked");
      await saveRecord(key, kind, id, data);
      await reload();
    },
    [key, kind, id, reload],
  );
  return { value, loading: items === null, error, save };
}
