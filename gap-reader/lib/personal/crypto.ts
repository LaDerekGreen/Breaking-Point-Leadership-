/**
 * Personal Gap Reader encryption. Runs in the browser (and in Node for tests)
 * on WebCrypto only.
 *
 * The key is derived from the user's own passphrase with PBKDF2-SHA-256 and
 * a per-user random salt, and is created non-extractable. It never leaves the
 * browser. The server stores the salt, the iteration count, a verifier and
 * ciphertext, so neither the publisher of this app nor any organization's
 * administrators can read a personal record.
 */

export const KDF_ITERATIONS = 600_000;
const VERIFIER_PLAINTEXT = "gap-reader-personal-vault-v1";

const enc = new TextEncoder();
const dec = new TextDecoder();

function subtle(): SubtleCrypto {
  const c = globalThis.crypto;
  if (!c?.subtle) throw new Error("This browser cannot encrypt. Use a current browser over https.");
  return c.subtle;
}

export function toB64(bytes: ArrayBuffer | Uint8Array): string {
  const u = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]);
  return btoa(s);
}

export function fromB64(b64: string): Uint8Array<ArrayBuffer> {
  const s = atob(b64);
  const u = new Uint8Array(new ArrayBuffer(s.length));
  for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
  return u;
}

export function randomSalt(): string {
  return toB64(globalThis.crypto.getRandomValues(new Uint8Array(16)));
}

export async function deriveKey(passphrase: string, saltB64: string, iterations = KDF_ITERATIONS): Promise<CryptoKey> {
  const base = await subtle().importKey("raw", enc.encode(passphrase.normalize("NFKC")), "PBKDF2", false, ["deriveKey"]);
  return subtle().deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: fromB64(saltB64), iterations },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export type Sealed = { iv: string; ciphertext: string };

export async function encryptString(key: CryptoKey, plain: string, aad?: string): Promise<Sealed> {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const ct = await subtle().encrypt({ name: "AES-GCM", iv, ...(aad ? { additionalData: enc.encode(aad) } : {}) }, key, enc.encode(plain));
  return { iv: toB64(iv), ciphertext: toB64(ct) };
}

export async function decryptString(key: CryptoKey, sealed: Sealed, aad?: string): Promise<string> {
  const pt = await subtle().decrypt(
    { name: "AES-GCM", iv: fromB64(sealed.iv), ...(aad ? { additionalData: enc.encode(aad) } : {}) },
    key,
    fromB64(sealed.ciphertext),
  );
  return dec.decode(pt);
}

/** The record ID and kind are bound to the ciphertext, so records cannot be swapped on the server. */
export const recordAad = (id: string, kind: string) => `${kind}:${id}`;

export async function encryptJSON(key: CryptoKey, value: unknown, aad?: string): Promise<Sealed> {
  return encryptString(key, JSON.stringify(value), aad);
}

export async function decryptJSON<T>(key: CryptoKey, sealed: Sealed, aad?: string): Promise<T> {
  return JSON.parse(await decryptString(key, sealed, aad)) as T;
}

export async function makeVerifier(key: CryptoKey): Promise<Sealed> {
  return encryptString(key, VERIFIER_PLAINTEXT, "verifier");
}

export async function checkVerifier(key: CryptoKey, sealed: Sealed): Promise<boolean> {
  try {
    return (await decryptString(key, sealed, "verifier")) === VERIFIER_PLAINTEXT;
  } catch {
    return false;
  }
}

export function passphraseProblem(p: string): string | null {
  if (p.length < 12) return "Use at least twelve characters. A short sentence works well.";
  if (/^(.)\1+$/.test(p)) return "Choose something less predictable.";
  return null;
}
