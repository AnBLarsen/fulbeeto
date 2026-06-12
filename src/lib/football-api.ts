import type {
  FDMatch,
  FDMatchesResponse,
  FDStandingsResponse,
  FDTeamDetail,
} from "@/types/football";

const BASE_URL = "https://api.football-data.org/v4";
const COMPETITION = "WC"; // FIFA World Cup

function getHeaders() {
  const key = process.env.FOOTBALL_DATA_KEY;
  if (!key) throw new Error("FOOTBALL_DATA_KEY is not set in .env.local");
  return { "X-Auth-Token": key };
}

async function apiFetch<T>(
  path: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: getHeaders(),
    next: { revalidate: 60 },
  });

  const text = await res.text();

  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const json = JSON.parse(text);
      if (json.message) msg = json.message;
    } catch { /* ignore */ }
    throw new Error(`football-data.org ${path} → ${msg}`);
  }

  return JSON.parse(text) as T;
}

// ─── Public helpers ───────────────────────────────────────────────────────────

/** Fixtures for a date or date range, defaults to today */
export async function getFixtures(date?: string, dateFrom?: string, dateTo?: string): Promise<FDMatch[]> {
  const from = dateFrom ?? date ?? new Date().toISOString().slice(0, 10);
  const to = dateTo ?? date ?? new Date().toISOString().slice(0, 10);
  const data = await apiFetch<FDMatchesResponse>(
    `/competitions/${COMPETITION}/matches`,
    { dateFrom: from, dateTo: to }
  );
  return data.matches;
}

/** The first scheduled match of the tournament */
export async function getOpeningMatch(): Promise<FDMatch | null> {
  const data = await apiFetch<FDMatchesResponse>(
    `/competitions/${COMPETITION}/matches`,
    { status: "SCHEDULED,TIMED" }
  );
  if (!data.matches.length) return null;
  return data.matches.sort(
    (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
  )[0];
}

/** Single match by ID — includes goals, bookings, and minute */
export async function getMatchResult(matchId: number): Promise<FDMatch | null> {
  try {
    // The v4 API returns the match at the top level, not nested under "match"
    const data = await apiFetch<FDMatch & { match?: FDMatch }>(`/matches/${matchId}`);
    return data.match ?? (data.id ? data : null);
  } catch {
    return null;
  }
}

/** All group standings — optionally filter to a single group (e.g. "GROUP_A") */
export async function getStandings(group?: string): Promise<FDStandingsResponse> {
  const data = await apiFetch<FDStandingsResponse>(
    `/competitions/${COMPETITION}/standings`
  );
  if (!group) return data;

  // Normalise: accept "Group A" or "GROUP_A"
  const normalised = group.toUpperCase().replace(/\s+/g, "_");
  return {
    ...data,
    standings: data.standings.filter(
      (s) => s.group?.toUpperCase() === normalised
    ),
  };
}

/** Team detail + squad */
export async function getTeamDetail(teamId: number): Promise<FDTeamDetail | null> {
  try {
    return await apiFetch<FDTeamDetail>(`/teams/${teamId}`);
  } catch {
    return null;
  }
}

// Stages football-data.org uses for WC knockout rounds (handle both naming conventions)
export const KNOCKOUT_STAGES = new Set([
  "LAST_32", "ROUND_OF_32",
  "LAST_16", "ROUND_OF_16",
  "QUARTER_FINALS",
  "SEMI_FINALS",
  "THIRD_PLACE",
  "FINAL",
]);

// Canonical stage key (normalise LAST_32 → ROUND_OF_32, etc.)
export function normaliseStage(stage: string): string {
  if (stage === "LAST_32") return "ROUND_OF_32";
  if (stage === "LAST_16") return "ROUND_OF_16";
  return stage;
}

/** Every match in the tournament — no date filter, let the API return all */
export async function getAllMatches(): Promise<FDMatch[]> {
  const data = await apiFetch<FDMatchesResponse>(
    `/competitions/${COMPETITION}/matches`
  );
  return data.matches;
}

/** All knockout-round matches for the tournament */
export async function getKnockoutMatches(): Promise<FDMatch[]> {
  const data = await apiFetch<FDMatchesResponse>(
    `/competitions/${COMPETITION}/matches`
  );
  return data.matches
    .filter((m) => KNOCKOUT_STAGES.has(m.stage))
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());
}

/** Team's World Cup matches */
export async function getTeamMatches(teamId: number): Promise<FDMatch[]> {
  const data = await apiFetch<FDMatchesResponse>(
    `/teams/${teamId}/matches`,
    { competitions: COMPETITION, status: "FINISHED,IN_PLAY,SCHEDULED,TIMED" }
  );
  return data.matches;
}
