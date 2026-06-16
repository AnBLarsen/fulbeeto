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

// ─── Server-side in-memory cache ─────────────────────────────────────────────
// Reduces API calls so the free tier's 10 req/min limit is less likely to be hit.
// Keys: full URL string. TTL: 5 min for finished match details, 60 s for everything else.
const _cache = new Map<string, { data: unknown; expires: number }>();
const TTL_DEFAULT = 60_000;        // 60 s
const TTL_FINISHED = 5 * 60_000;  // 5 min — finished matches never change

function getCached<T>(key: string): T | undefined {
  const entry = _cache.get(key);
  if (entry && entry.expires > Date.now()) return entry.data as T;
  _cache.delete(key);
  return undefined;
}

function setCache(key: string, data: unknown, ttl = TTL_DEFAULT) {
  _cache.set(key, { data, expires: Date.now() + ttl });
}

async function apiFetch<T>(
  path: string,
  params: Record<string, string> = {},
  ttl?: number
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const key = url.toString();

  const hit = getCached<T>(key);
  if (hit !== undefined) return hit;

  const res = await fetch(url.toString(), {
    headers: getHeaders(),
    next: { revalidate: 60 },
  });

  const text = await res.text();

  if (!res.ok) {
    // Expose rate-limit errors with a clear prefix so callers can handle them
    if (res.status === 429) {
      let wait = "a moment";
      try {
        const secs = Number(res.headers.get("X-RequestCounter-Reset") ?? "0");
        if (secs > 0) wait = `${secs} second${secs !== 1 ? "s" : ""}`;
      } catch { /* ignore */ }
      throw new Error(`RATE_LIMITED: The football data API rate limit was reached. Please wait ${wait} and try again.`);
    }
    let msg = `${res.status} ${res.statusText}`;
    try {
      const json = JSON.parse(text);
      if (json.message) {
        // Some 429 responses come back as 200 with a message — detect them too
        if (json.message.toLowerCase().includes("request limit") || json.message.toLowerCase().includes("rate limit")) {
          throw new Error(`RATE_LIMITED: ${json.message}`);
        }
        msg = json.message;
      }
    } catch (inner) {
      if ((inner as Error).message?.startsWith("RATE_LIMITED:")) throw inner;
    }
    throw new Error(`football-data.org ${path} → ${msg}`);
  }

  const data = JSON.parse(text) as T;
  setCache(key, data, ttl ?? TTL_DEFAULT);
  return data;
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
export async function getMatchResult(matchId: number, finished = false): Promise<FDMatch | null> {
  try {
    // The v4 API returns the match at the top level, not nested under "match"
    const data = await apiFetch<FDMatch & { match?: FDMatch }>(
      `/matches/${matchId}`,
      {},
      finished ? TTL_FINISHED : TTL_DEFAULT
    );
    return data.match ?? (data.id ? data : null);
  } catch {
    return null;
  }
}

/** All group standings — optionally filter to a single group (e.g. "GROUP_A") */
export async function getStandings(group?: string): Promise<FDStandingsResponse> {
  const data = await apiFetch<FDStandingsResponse>(
    `/competitions/${COMPETITION}/standings`,
    {},
    TTL_FINISHED // standings change only after matches end — cache for 5 min
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
