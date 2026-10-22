import { NextResponse } from "next/server";
import { personalDb } from "@/lib/personal/db";
import { personalUserId } from "@/lib/personal/session";

/** One action deletes everything: every record, the vault, sessions and the account. */
export async function DELETE() {
  const userId = await personalUserId();
  if (!userId) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  await personalDb.user.delete({ where: { id: userId } });
  const res = NextResponse.json({ ok: true });
  for (const name of ["gr-personal.session-token", "__Secure-gr-personal.session-token"]) res.cookies.delete(name);
  return res;
}
