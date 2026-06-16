import { NextRequest, NextResponse } from "next/server";
import { getMatchResult } from "@/lib/football-api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!id || isNaN(id)) {
    return NextResponse.json({ error: "Invalid match ID" }, { status: 400 });
  }
  // Caller can pass ?finished=1 to allow longer server-side caching
  const finished = req.nextUrl.searchParams.get("finished") === "1";
  try {
    const match = await getMatchResult(id, finished);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    // Cache the response in the CDN/browser too — finished matches are immutable
    const headers: Record<string, string> = finished
      ? { "Cache-Control": "public, max-age=300, stale-while-revalidate=60" }
      : { "Cache-Control": "no-store" };
    return NextResponse.json(match, { headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
