import { NextRequest, NextResponse } from "next/server";
import { getFixtures } from "@/lib/football-api";

export async function GET(req: NextRequest) {
  try {
    const date     = req.nextUrl.searchParams.get("date")     ?? undefined;
    const dateFrom = req.nextUrl.searchParams.get("dateFrom") ?? undefined;
    const dateTo   = req.nextUrl.searchParams.get("dateTo")   ?? undefined;
    const fixtures = await getFixtures(date, dateFrom, dateTo);
    return NextResponse.json(fixtures);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
