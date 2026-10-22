import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { IMPORT_KINDS, type ImportKind } from "@/lib/org/importSchema";
import { importRows } from "@/lib/org/importer";
import { currentNotice } from "@/lib/org/notice";
import { orgDb } from "@/lib/org/db";

/** API import (A2). Same schema-level checks as CSV import. */
export async function POST(req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const token = process.env.IMPORT_API_TOKEN ?? "";
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token || given.length !== token.length || !timingSafeEqual(Buffer.from(given), Buffer.from(token)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { kind } = await params;
  if (!IMPORT_KINDS.includes(kind as ImportKind)) return NextResponse.json({ error: "Unknown import kind" }, { status: 404 });
  if (!(await currentNotice())) return NextResponse.json({ error: "Publish the Notice before importing any records." }, { status: 409 });
  const body = (await req.json().catch(() => null)) as { rows?: Record<string, unknown>[] } | null;
  if (!body?.rows || !Array.isArray(body.rows)) return NextResponse.json({ error: "Body must be { rows: [...] }" }, { status: 400 });
  const headers = [...new Set(body.rows.flatMap((r) => Object.keys(r)))];
  const rows = body.rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v == null ? "" : String(v)])));
  // The API acts as the first program lead for the audit trail.
  const lead = await orgDb.user.findFirst({ where: { roles: { has: "program_lead" } }, orderBy: { createdAt: "asc" } });
  if (!lead) return NextResponse.json({ error: "No program lead exists." }, { status: 409 });
  const r = await importRows(kind as ImportKind, { fileName: "api", headers, rows }, lead.id);
  return NextResponse.json(r, { status: r.ok ? 200 : 422 });
}
