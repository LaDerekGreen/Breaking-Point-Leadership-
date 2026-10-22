import { NextResponse } from "next/server";
import { personalDb } from "@/lib/personal/db";
import { personalUserId } from "@/lib/personal/session";
import { B64_RE } from "@/lib/personal/limits";

/** Key derivation parameters and the verifier. Never a key, never a passphrase. */
export async function GET() {
  const userId = await personalUserId();
  if (!userId) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const v = await personalDb.vault.findUnique({ where: { userId } });
  if (!v) return NextResponse.json({ vault: null });
  return NextResponse.json({ vault: { salt: v.salt, iterations: v.iterations, verifier: { iv: v.verifierIv, ciphertext: v.verifierCiphertext } } });
}

export async function POST(req: Request) {
  const userId = await personalUserId();
  if (!userId) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const b = (await req.json().catch(() => null)) as { salt?: string; iterations?: number; verifier?: { iv?: string; ciphertext?: string }; replace?: boolean } | null;
  if (!b?.salt || !B64_RE.test(b.salt) || !Number.isInteger(b.iterations) || (b.iterations ?? 0) < 100_000 || !b.verifier?.iv || !b.verifier?.ciphertext)
    return NextResponse.json({ error: "Invalid vault" }, { status: 400 });
  const existing = await personalDb.vault.findUnique({ where: { userId } });
  if (existing && !b.replace) return NextResponse.json({ error: "A vault already exists" }, { status: 409 });
  const data = { salt: b.salt, iterations: b.iterations!, verifierIv: b.verifier.iv, verifierCiphertext: b.verifier.ciphertext };
  await personalDb.vault.upsert({ where: { userId }, create: { userId, ...data }, update: data });
  return NextResponse.json({ ok: true });
}
