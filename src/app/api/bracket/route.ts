import { NextResponse } from "next/server";
import { getKnockoutMatches } from "@/lib/football-api";

export async function GET() {
  try {
    const matches = await getKnockoutMatches();
    return NextResponse.json(matches);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
