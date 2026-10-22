/**
 * Browser side of the Personal Gap Reader vault. Everything is encrypted
 * here before it is sent, and decrypted here after it arrives.
 */
import {
  checkVerifier, decryptJSON, deriveKey, encryptJSON, KDF_ITERATIONS, makeVerifier, randomSalt, recordAad, type Sealed,
} from "./crypto";

export type VaultParams = { salt: string; iterations: number; verifier: Sealed };
export type Stored<T> = { id: string; kind: string; data: T; updatedAt: string };

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) }, credentials: "same-origin" });
  if (res.status === 401) throw new Error("Your session has ended. Sign in again.");
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status}).`);
  return body;
}

export function newId(): string {
  const b = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

export async function fetchVault(): Promise<VaultParams | null> {
  return (await api<{ vault: VaultParams | null }>("/api/personal/vault")).vault;
}

export async function createVault(passphrase: string): Promise<CryptoKey> {
  const salt = randomSalt();
  const key = await deriveKey(passphrase, salt, KDF_ITERATIONS);
  await api("/api/personal/vault", { method: "POST", body: JSON.stringify({ salt, iterations: KDF_ITERATIONS, verifier: await makeVerifier(key) }) });
  return key;
}

export async function unlock(passphrase: string, v: VaultParams): Promise<CryptoKey | null> {
  const key = await deriveKey(passphrase, v.salt, v.iterations);
  return (await checkVerifier(key, v.verifier)) ? key : null;
}

type Raw = { id: string; kind: string; iv: string; ciphertext: string; updatedAt: string };

export async function listRecords<T>(key: CryptoKey, kind: string): Promise<Stored<T>[]> {
  const { records } = await api<{ records: Raw[] }>(`/api/personal/records?kind=${encodeURIComponent(kind)}`);
  const out: Stored<T>[] = [];
  for (const r of records) {
    try {
      out.push({ id: r.id, kind: r.kind, updatedAt: r.updatedAt, data: await decryptJSON<T>(key, r, recordAad(r.id, r.kind)) });
    } catch {
      /* a record that does not decrypt under this key is skipped, never shown */
    }
  }
  return out;
}

export async function getRecord<T>(key: CryptoKey, kind: string, id: string): Promise<T | null> {
  return (await listRecords<T>(key, kind)).find((r) => r.id === id)?.data ?? null;
}

export async function saveRecord(key: CryptoKey, kind: string, id: string, data: unknown): Promise<void> {
  const sealed = await encryptJSON(key, data, recordAad(id, kind));
  await api(`/api/personal/records/${id}`, { method: "PUT", body: JSON.stringify({ kind, ...sealed }) });
}

export async function deleteRecord(id: string): Promise<void> {
  await api(`/api/personal/records/${id}`, { method: "DELETE" });
}

export async function exportAll(key: CryptoKey): Promise<Stored<unknown>[]> {
  const { records } = await api<{ records: Raw[] }>("/api/personal/records");
  const out: Stored<unknown>[] = [];
  for (const r of records) {
    try {
      const data = await decryptJSON<unknown>(key, r, recordAad(r.id, r.kind));
      out.push({ id: r.id, kind: r.kind, updatedAt: r.updatedAt, data: r.kind === "settings" ? { ...(data as object), apiKey: "(removed from export)" } : data });
    } catch {
      /* skip */
    }
  }
  return out;
}

export async function rekey(oldKey: CryptoKey, newPassphrase: string): Promise<CryptoKey> {
  const { records } = await api<{ records: Raw[] }>("/api/personal/records");
  const salt = randomSalt();
  const key = await deriveKey(newPassphrase, salt, KDF_ITERATIONS);
  const re = [];
  for (const r of records) {
    const data = await decryptJSON<unknown>(oldKey, r, recordAad(r.id, r.kind));
    re.push({ id: r.id, kind: r.kind, ...(await encryptJSON(key, data, recordAad(r.id, r.kind))) });
  }
  await api("/api/personal/rekey", { method: "POST", body: JSON.stringify({ salt, iterations: KDF_ITERATIONS, verifier: await makeVerifier(key), records: re }) });
  return key;
}

export async function deleteEverything(): Promise<void> {
  await api("/api/personal/account", { method: "DELETE" });
}
