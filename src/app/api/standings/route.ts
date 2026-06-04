import { NextRequest, NextResponse } from "next/server";
import { getStandings } from "@/lib/football-api";

export async function GET(req: NextRequest) {
  try {
    const group = req.nextUrl.searchParams.get("group") ?? undefined;
    const standings = await getStandings(group);
    return NextResponse.json(standings);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
