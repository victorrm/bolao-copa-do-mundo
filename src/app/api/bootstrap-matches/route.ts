import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { syncWorldCupFromFootballData } from "@/lib/football-data/sync";

export const dynamic = "force-dynamic";

// One-shot bootstrap endpoint. Refuses if any match already exists in the DB,
// so this can run exactly once on a fresh D1. Caller passes the Football-Data
// API key in the X-FD-Key header. Intended to be removed in the next commit.
export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-fd-key");
  if (!apiKey) {
    return NextResponse.json({ error: "missing x-fd-key header" }, { status: 400 });
  }

  const matchCount = await db
    .select({ c: sql<number>`count(*)` })
    .from(schema.matches)
    .then((r) => Number(r[0]?.c ?? 0));
  if (matchCount > 0) {
    return NextResponse.json(
      { error: "matches already populated; refusing", count: matchCount },
      { status: 409 },
    );
  }

  try {
    const result = await syncWorldCupFromFootballData(apiKey);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
