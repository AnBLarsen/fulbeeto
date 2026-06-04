import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTeamDetail, getTeamMatches } from "@/lib/football-api";
import type { FDMatch } from "@/types/football";

export const revalidate = 300;

interface Params {
  params: Promise<{ id: string }>;
}

function MatchRow({ match, teamId }: { match: FDMatch; teamId: number }) {
  const isHome = match.homeTeam.id === teamId;
  const opponent = isHome ? match.awayTeam : match.homeTeam;
  const score = match.score.fullTime;
  const hasScore = score.home !== null && score.away !== null;
  const teamGoals = isHome ? score.home : score.away;
  const oppGoals = isHome ? score.away : score.home;
  const result =
    match.score.winner === null
      ? "—"
      : match.score.winner === "DRAW"
      ? "D"
      : (isHome && match.score.winner === "HOME_TEAM") ||
        (!isHome && match.score.winner === "AWAY_TEAM")
      ? "W"
      : "L";

  const resultColor =
    result === "W" ? "text-bee-green" : result === "L" ? "text-red-400" : "text-gray-400";

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
      <span className={`w-5 text-xs font-black ${resultColor}`}>{result}</span>
      {opponent.crest && (
        <Image src={opponent.crest} alt={opponent.name} width={20} height={20} unoptimized className="object-contain" />
      )}
      <Link href={`/teams/${opponent.id}`} className="flex-1 text-sm hover:text-bee-yellow transition-colors">
        {isHome ? "vs" : "@"} {opponent.shortName}
      </Link>
      {hasScore && (
        <span className="text-sm font-bold tabular-nums text-white">
          {teamGoals} – {oppGoals}
        </span>
      )}
      <span className="text-xs text-gray-500">
        {new Date(match.utcDate).toLocaleDateString([], { month: "short", day: "numeric" })}
      </span>
    </div>
  );
}

export default async function TeamPage({ params }: Params) {
  const { id } = await params;
  const teamId = Number(id);
  if (isNaN(teamId)) notFound();

  const [team, matches] = await Promise.all([
    getTeamDetail(teamId),
    getTeamMatches(teamId).catch(() => [] as FDMatch[]),
  ]);

  if (!team) notFound();

  const finished = matches.filter((m) => m.status === "FINISHED");
  const wins = finished.filter(
    (m) =>
      (m.homeTeam.id === teamId && m.score.winner === "HOME_TEAM") ||
      (m.awayTeam.id === teamId && m.score.winner === "AWAY_TEAM")
  ).length;
  const draws = finished.filter((m) => m.score.winner === "DRAW").length;
  const losses = finished.length - wins - draws;
  const goalsFor = finished.reduce((acc, m) => {
    const s = m.score.fullTime;
    return acc + (m.homeTeam.id === teamId ? (s.home ?? 0) : (s.away ?? 0));
  }, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-5">
        {team.crest && (
          <Image src={team.crest} alt={team.name} width={80} height={80} className="object-contain" unoptimized />
        )}
        <div>
          <h1 className="text-3xl font-black text-white">{team.name}</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {team.clubColors && <span>{team.clubColors} · </span>}
            {team.venue && <span>{team.venue}</span>}
          </p>
          {team.founded && (
            <p className="text-xs text-gray-600 mt-0.5">Est. {team.founded}</p>
          )}
        </div>
      </div>

      {/* WC stats */}
      {finished.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            World Cup 2026 Stats
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Played", value: finished.length },
              { label: "Wins", value: wins },
              { label: "Draws", value: draws },
              { label: "Goals For", value: goalsFor },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
                <p className="text-2xl font-black text-bee-yellow">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matches */}
      {matches.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Matches
          </h2>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-1">
            {matches.map((m) => (
              <MatchRow key={m.id} match={m} teamId={teamId} />
            ))}
          </div>
        </div>
      )}

      {/* Squad */}
      {team.squad && team.squad.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Squad</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {team.squad.map((p) => (
              <div key={p.id} className="bg-white/5 rounded-lg px-3 py-2 border border-white/10">
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-gray-500">{p.position} · {p.nationality}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
