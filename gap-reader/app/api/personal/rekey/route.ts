import { NextResponse } from "next/server";
import { personalDb } from "@/lib/personal/db";
import { personalUserId } from "@/lib/personal/session";
import { B64_RE, ID_RE, KIND_RE, MAX_CIPHERTEXT } from "@/lib/personal/limits";

type Rec = { id: string; kind: string; iv: string; ciphertext: string };

/** Passphrase change: the browser re-encrypts everything and the swap happens in one transaction. */
export async function POST(req: Request) {
  const userId = await personalUserId();
  if (!userId) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const b = (await req.json().catch(() => null)) as { salt?: string; iterations?: number; verifier?: { iv: string; ciphertext: string }; records?: Rec[] } | null;
  if (!b?.salt || !B64_RE.test(b.salt) || !Number.isInteger(b.iterations) || !b.verifier || !Array.isArray(b.records)) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  for (const r of b.records)
    if (!ID_RE.test(r.id) || !KIND_RE.test(r.kind) || !B64_RE.test(r.iv) || !B64_RE.test(r.ciphertext) || r.ciphertext.length > MAX_CIPHERTEXT)
      return NextResponse.json({ error: "Invalid record" }, { status: 400 });
  const ids = (await personalDb.record.findMany({ where: { userId }, select: { id: true } })).map((r) => r.id).sort();
  if (JSON.stringify(ids) !== JSON.stringify(b.records.map((r) => r.id).sort())) return NextResponse.json({ error: "Every record must be re-encrypted together. Reload and try again." }, { status: 409 });
  await personalDb.$transaction([
    personalDb.vault.update({ where: { userId }, data: { salt: b.salt, iterations: b.iterations!, verifierIv: b.verifier.iv, verifierCiphertext: b.verifier.ciphertext } }),
    ...b.records.map((r) => personalDb.record.update({ where: { id: r.id }, data: { iv: r.iv, ciphertext: r.ciphertext } })),
  ]);
  return NextResponse.json({ ok: true });
}
