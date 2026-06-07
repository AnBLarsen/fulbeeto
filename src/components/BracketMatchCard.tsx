import Image from "next/image";
import type { FDMatch } from "@/types/football";

interface BracketMatchCardProps {
  match: FDMatch;
  tbd: string;
  isFinal?: boolean;
}

function TeamRow({
  name,
  crest,
  score,
  isWinner,
  tbd,
}: {
  name: string;
  crest: string;
  score: number | null;
  isWinner: boolean;
  tbd: string;
}) {
  const displayName = name && name !== "TBD" ? name : tbd;
  const isTbd = !name || name === "TBD";

  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2.5 ${
        isWinner ? "bg-bee-yellow/10" : ""
      }`}
    >
      {crest && !isTbd ? (
        <Image
          src={crest}
          alt={displayName}
          width={24}
          height={24}
          className="shrink-0 object-contain"
          style={{ width: 24, height: 24 }}
          unoptimized
        />
      ) : (
        <div className="w-6 h-6 rounded-full bg-white/10 shrink-0 flex items-center justify-center text-[10px] text-gray-500">
          ?
        </div>
      )}
      <span
        className={`flex-1 text-sm font-medium truncate ${
          isTbd ? "text-gray-500 italic" : isWinner ? "text-white" : "text-gray-300"
        }`}
      >
        {displayName}
      </span>
      <span
        className={`text-sm font-black tabular-nums ml-auto pl-2 ${
          isWinner ? "text-bee-yellow" : "text-gray-400"
        }`}
      >
        {score !== null ? score : "–"}
      </span>
    </div>
  );
}

export function BracketMatchCard({ match, tbd, isFinal = false }: BracketMatchCardProps) {
  const finished = match.status === "FINISHED";
  const inPlay = match.status === "IN_PLAY" || match.status === "PAUSED";
  const homeScore = match.score.fullTime.home;
  const awayScore = match.score.fullTime.away;

  const homeWins =
    finished &&
    match.score.winner === "HOME_TEAM";
  const awayWins =
    finished &&
    match.score.winner === "AWAY_TEAM";

  const kickoff = new Date(match.utcDate).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`rounded-xl border overflow-hidden ${
        isFinal
          ? "border-bee-yellow/50 shadow-[0_0_20px_rgba(245,196,0,0.15)]"
          : "border-white/10"
      } bg-bee-black/60`}
    >
      <TeamRow
        name={match.homeTeam.name}
        crest={match.homeTeam.crest}
        score={finished || inPlay ? homeScore : null}
        isWinner={homeWins}
        tbd={tbd}
      />
      <div className="h-px bg-white/5" />
      <TeamRow
        name={match.awayTeam.name}
        crest={match.awayTeam.crest}
        score={finished || inPlay ? awayScore : null}
        isWinner={awayWins}
        tbd={tbd}
      />

      {/* Status bar */}
      <div className="px-3 py-1.5 bg-white/5 flex items-center justify-between">
        {inPlay ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-bee-green uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-bee-green animate-pulse" />
            Live
          </span>
        ) : (
          <span className="text-[10px] text-gray-500">{kickoff}</span>
        )}
        {match.score.duration !== "REGULAR" && finished && (
          <span className="text-[10px] text-gray-500">
            {match.score.duration === "PENALTY_SHOOTOUT" ? "Pen." : "AET"}
          </span>
        )}
      </div>
    </div>
  );
}
