import { NextResponse } from "next/server";
import { personalDb } from "@/lib/personal/db";
import { personalUserId } from "@/lib/personal/session";
import { B64_RE, ID_RE, KIND_RE, MAX_CIPHERTEXT } from "@/lib/personal/limits";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await personalUserId();
  if (!userId) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const { id } = await params;
  const b = (await req.json().catch(() => null)) as { kind?: string; iv?: string; ciphertext?: string } | null;
  if (!ID_RE.test(id) || !b?.kind || !KIND_RE.test(b.kind) || !b.iv || !B64_RE.test(b.iv) || !b.ciphertext || !B64_RE.test(b.ciphertext) || b.ciphertext.length > MAX_CIPHERTEXT)
    return NextResponse.json({ error: "Invalid record" }, { status: 400 });
  const existing = await personalDb.record.findUnique({ where: { id } });
  if (existing && existing.userId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await personalDb.record.upsert({
    where: { id },
    create: { id, userId, kind: b.kind, iv: b.iv, ciphertext: b.ciphertext },
    update: { kind: b.kind, iv: b.iv, ciphertext: b.ciphertext },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await personalUserId();
  if (!userId) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const { id } = await params;
  await personalDb.record.deleteMany({ where: { id, userId } });
  return NextResponse.json({ ok: true });
}
