import { NextResponse } from "next/server";
import { personalDb } from "@/lib/personal/db";
import { personalUserId } from "@/lib/personal/session";
import { KIND_RE } from "@/lib/personal/limits";

/** Ciphertext only. The server cannot read any of it. */
export async function GET(req: Request) {
  const userId = await personalUserId();
  if (!userId) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const kind = new URL(req.url).searchParams.get("kind");
  if (kind && !KIND_RE.test(kind)) return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  const records = await personalDb.record.findMany({
    where: { userId, ...(kind ? { kind } : {}) },
    select: { id: true, kind: true, iv: true, ciphertext: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ records });
}
