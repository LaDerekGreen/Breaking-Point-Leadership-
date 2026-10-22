"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchVault, type VaultParams } from "@/lib/personal/vaultClient";
import { forgetKey, recallKey, rememberKey } from "@/lib/personal/keystore";

type Status = "loading" | "needs-setup" | "locked" | "unlocked" | "error";
type Ctx = {
  status: Status;
  key: CryptoKey | null;
  vault: VaultParams | null;
  error: string | null;
  setKey: (k: CryptoKey) => Promise<void>;
  lock: () => Promise<void>;
  reload: () => Promise<void>;
};

const VaultContext = createContext<Ctx | null>(null);

export function VaultProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [key, setKeyState] = useState<CryptoKey | null>(null);
  const [vault, setVault] = useState<VaultParams | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const v = await fetchVault();
      setVault(v);
      if (!v) {
        setStatus("needs-setup");
        return;
      }
      const k = await recallKey();
      setKeyState(k);
      setStatus(k ? "unlocked" : "locked");
    } catch (e) {
      setError((e as Error).message);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const setKey = useCallback(async (k: CryptoKey) => {
    await rememberKey(k);
    setKeyState(k);
    setVault(await fetchVault());
    setStatus("unlocked");
  }, []);

  const lock = useCallback(async () => {
    await forgetKey();
    setKeyState(null);
    setStatus("locked");
  }, []);

  return <VaultContext.Provider value={{ status, key, vault, error, setKey, lock, reload }}>{children}</VaultContext.Provider>;
}

export function useVault(): Ctx {
  const c = useContext(VaultContext);
  if (!c) throw new Error("useVault outside VaultProvider");
  return c;
}

/** The unlocked key. Only call inside <VaultGate>. */
export function useKey(): CryptoKey {
  const { key } = useVault();
  if (!key) throw new Error("The vault is locked.");
  return key;
}
