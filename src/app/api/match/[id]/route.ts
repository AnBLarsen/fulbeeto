import { NextRequest, NextResponse } from "next/server";
import { getMatchResult } from "@/lib/football-api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!id || isNaN(id)) {
    return NextResponse.json({ error: "Invalid match ID" }, { status: 400 });
  }
  try {
    const match = await getMatchResult(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    return NextResponse.json(match);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
