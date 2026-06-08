// ─── football-data.org v4 types ───────────────────────────────────────────────

export interface FDTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

export interface FDScore {
  winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
  duration: "REGULAR" | "EXTRA_TIME" | "PENALTY_SHOOTOUT";
  fullTime: { home: number | null; away: number | null };
  halfTime: { home: number | null; away: number | null };
}

export type MatchStatus =
  | "SCHEDULED"
  | "TIMED"
  | "IN_PLAY"
  | "PAUSED"
  | "FINISHED"
  | "POSTPONED"
  | "SUSPENDED"
  | "CANCELLED";

export interface FDMatch {
  id: number;
  utcDate: string;
  status: MatchStatus;
  matchday: number | null;
  stage: string;
  group: string | null;
  homeTeam: FDTeam;
  awayTeam: FDTeam;
  score: FDScore;
}

export interface FDStandingEntry {
  position: number;
  team: FDTeam;
  playedGames: number;
  form: string | null;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface FDStandingsGroup {
  stage: string;
  type: "TOTAL" | "HOME" | "AWAY";
  group: string | null;
  table: FDStandingEntry[];
}

export interface FDStandingsResponse {
  competition: { id: number; name: string; code: string };
  season: { id: number; startDate: string; endDate: string; currentMatchday: number | null };
  standings: FDStandingsGroup[];
}

export interface FDTeamDetail extends FDTeam {
  address?: string;
  website?: string;
  founded?: number;
  clubColors?: string;
  venue?: string;
  coach?: { name: string; nationality: string } | null;
  squad?: Array<{
    id: number;
    name: string;
    position: string;
    nationality: string;
  }>;
}

export interface FDMatchesResponse {
  resultSet: { count: number; first: string; last: string; played: number };
  matches: FDMatch[];
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  thinking?: string; // reasoning text from tool-use turns, shown separately
}
