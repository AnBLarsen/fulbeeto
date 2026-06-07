import Image from "next/image";
import Link from "next/link";
import type { FDMatch } from "@/types/football";

interface FixtureCardProps {
  match: FDMatch;
}

function StatusBadge({ match }: { match: FDMatch }) {
  const { status } = match;
  if (status === "IN_PLAY" || status === "PAUSED") {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-bee-green animate-pulse-slow">
        <span className="w-1.5 h-1.5 rounded-full bg-bee-green inline-block" />
        {status === "PAUSED" ? "HT" : "LIVE"}
      </span>
    );
  }
  if (status === "FINISHED") {
    return <span className="text-xs text-gray-400 font-medium">Full Time</span>;
  }
  if (status === "POSTPONED" || status === "CANCELLED" || status === "SUSPENDED") {
    return <span className="text-xs text-red-400 font-medium">{status}</span>;
  }
  // SCHEDULED or TIMED
  const kickoff = new Date(match.utcDate);
  return (
    <span className="text-xs text-gray-500">
      {kickoff.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </span>
  );
}

function TeamCrest({ crest, name, size = 40 }: { crest: string; name: string; size?: number }) {
  if (!crest) {
    return (
      <div
        className="rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400 font-bold"
        style={{ width: size, height: size }}
      >
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  }
  return (
    <Image
      src={crest}
      alt={name}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="object-contain"
      unoptimized
    />
  );
}

export function FixtureCard({ match }: FixtureCardProps) {
  const { homeTeam, awayTeam, score, group, stage } = match;
  const isLive = match.status === "IN_PLAY" || match.status === "PAUSED";
  const hasScore = score.fullTime.home !== null && score.fullTime.away !== null;
  const label = group
    ? group.replace("_", " ")
    : stage.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  const homeWon = score.winner === "HOME_TEAM";
  const awayWon = score.winner === "AWAY_TEAM";

  return (
    <div
      className={`bee-stripes relative rounded-xl border transition-all hover:border-bee-yellow/50 ${
        isLive ? "border-bee-green/50 bg-bee-green/5" : "border-white/10 bg-white/5"
      } p-4`}
    >
      {/* Round label + status */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</span>
        <StatusBadge match={match} />
      </div>

      {/* Teams + score */}
      <div className="flex items-center justify-between gap-4">
        {/* Home */}
        <Link
          href={`/teams/${homeTeam.id}`}
          className="flex flex-col items-center gap-1.5 flex-1 hover:opacity-80 transition-opacity"
        >
          <TeamCrest crest={homeTeam.crest} name={homeTeam.name} size={40} />
          <span className="text-sm font-semibold text-center leading-tight">{homeTeam.shortName}</span>
          {homeWon && <span className="text-[10px] text-bee-yellow">▲ Winner</span>}
        </Link>

        {/* Score or kick-off time */}
        <div className="flex flex-col items-center gap-0.5 min-w-[70px]">
          {hasScore ? (
            <div className="flex items-center gap-2">
              <span className={`text-3xl font-black tabular-nums ${homeWon ? "text-bee-yellow" : "text-white"}`}>
                {score.fullTime.home}
              </span>
              <span className="text-gray-500 text-lg">–</span>
              <span className={`text-3xl font-black tabular-nums ${awayWon ? "text-bee-yellow" : "text-white"}`}>
                {score.fullTime.away}
              </span>
            </div>
          ) : (
            <div className="text-2xl font-black text-bee-yellow">
              {new Date(match.utcDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          )}
          <span className="text-[10px] text-gray-600">
            {score.duration !== "REGULAR" && match.status === "FINISHED"
              ? score.duration === "PENALTY_SHOOTOUT" ? "Pen" : "AET"
              : ""}
          </span>
        </div>

        {/* Away */}
        <Link
          href={`/teams/${awayTeam.id}`}
          className="flex flex-col items-center gap-1.5 flex-1 hover:opacity-80 transition-opacity"
        >
          <TeamCrest crest={awayTeam.crest} name={awayTeam.name} size={40} />
          <span className="text-sm font-semibold text-center leading-tight">{awayTeam.shortName}</span>
          {awayWon && <span className="text-[10px] text-bee-yellow">▲ Winner</span>}
        </Link>
      </div>
    </div>
  );
}
