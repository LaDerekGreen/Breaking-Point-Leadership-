/**
 * Keeps the derived, non-extractable CryptoKey in this browser between page
 * loads (IndexedDB can hold a CryptoKey without exposing its bytes). A
 * sessionStorage marker ties it to this browser session: a new session finds
 * no marker and forgets the key, so the vault is locked again.
 */
const DB = "gap-reader-personal";
const STORE = "keys";
const MARKER = "gap-reader-personal-session";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const r = fn(t.objectStore(STORE));
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

export async function rememberKey(key: CryptoKey): Promise<void> {
  try {
    sessionStorage.setItem(MARKER, "1");
    await tx("readwrite", (s) => s.put(key, "k"));
  } catch {
    /* private browsing: the key lives in memory only */
  }
}

export async function recallKey(): Promise<CryptoKey | null> {
  try {
    if (sessionStorage.getItem(MARKER) !== "1") {
      await forgetKey();
      return null;
    }
    return ((await tx("readonly", (s) => s.get("k"))) as CryptoKey | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function forgetKey(): Promise<void> {
  try {
    sessionStorage.removeItem(MARKER);
    await tx("readwrite", (s) => s.delete("k"));
  } catch {
    /* nothing stored */
  }
}
