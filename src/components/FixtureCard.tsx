"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import type { FDMatch, FDGoal, FDBooking } from "@/types/football";

interface FixtureCardProps {
  match: FDMatch;
}

/** Short timezone abbreviation for the user's local zone, e.g. "EDT", "CEST", "GMT+8" */
function localTz(): string {
  return (
    new Intl.DateTimeFormat(undefined, { timeZoneName: "short" })
      .formatToParts(new Date())
      .find((p) => p.type === "timeZoneName")?.value ?? "local"
  );
}

function StatusBadge({ match }: { match: FDMatch }) {
  const { status, minute } = match;
  if (status === "IN_PLAY" || status === "PAUSED") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-bee-green animate-pulse-slow">
        <span className="w-1.5 h-1.5 rounded-full bg-bee-green inline-block shrink-0" />
        {status === "PAUSED" ? "HT" : minute ? `${minute}'` : "LIVE"}
      </span>
    );
  }
  if (status === "FINISHED") {
    return <span className="text-xs text-gray-400 font-medium">Full Time</span>;
  }
  if (status === "POSTPONED" || status === "CANCELLED" || status === "SUSPENDED") {
    return <span className="text-xs text-red-400 font-medium">{status}</span>;
  }
  const kickoff = new Date(match.utcDate);
  return (
    <span className="text-xs text-gray-500">
      {kickoff.toLocaleDateString([], { month: "short", day: "numeric" })}
    </span>
  );
}

function GoalIcon() {
  return <span className="text-[11px]">⚽</span>;
}

function CardIcon({ type }: { type: string }) {
  if (type === "RED_CARD" || type === "YELLOW_RED_CARD") {
    return <span className="inline-block w-2.5 h-3.5 rounded-[2px] bg-red-500 shrink-0" />;
  }
  return <span className="inline-block w-2.5 h-3.5 rounded-[2px] bg-yellow-400 shrink-0" />;
}

function GoalsList({ goals, teamId }: { goals: FDGoal[]; teamId: number }) {
  const teamGoals = goals.filter((g) => g.team.id === teamId);
  if (!teamGoals.length) return null;
  return (
    <div className="flex flex-col gap-0.5 mt-1">
      {teamGoals.map((g, i) => (
        <div key={i} className="flex items-center gap-1 text-[10px] text-gray-400 justify-center">
          <GoalIcon />
          <span className="truncate max-w-[80px]">
            {g.scorer?.name?.split(" ").at(-1) ?? "OG"}
            {g.type === "OWN" ? " (OG)" : g.type === "PENALTY" ? " (P)" : ""}
          </span>
          <span className="text-gray-600">{g.minute}'</span>
        </div>
      ))}
    </div>
  );
}

function BookingsList({ bookings, teamId }: { bookings: FDBooking[]; teamId: number }) {
  const teamCards = bookings.filter((b) => b.team.id === teamId);
  if (!teamCards.length) return null;
  return (
    <div className="flex flex-col gap-0.5 mt-1">
      {teamCards.map((b, i) => (
        <div key={i} className="flex items-center gap-1 text-[10px] text-gray-400 justify-center">
          <CardIcon type={b.card} />
          <span className="truncate max-w-[80px]">
            {b.player?.name?.split(" ").at(-1) ?? "—"}
          </span>
          <span className="text-gray-600">{b.minute}'</span>
        </div>
      ))}
    </div>
  );
}

function TeamCrest({ crest, name, size = 40 }: { crest: string | null; name: string | null; size?: number }) {
  if (!crest) {
    return (
      <div
        className="rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400 font-bold"
        style={{ width: size, height: size }}
      >
        {name ? name.slice(0, 2).toUpperCase() : "?"}
      </div>
    );
  }
  return (
    <Image
      src={crest}
      alt={name ?? "TBD"}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="object-contain"
      unoptimized
    />
  );
}

export function FixtureCard({ match }: FixtureCardProps) {
  const locale = useLocale();
  const { homeTeam, awayTeam, score, group, stage, goals, bookings } = match;
  const isLive      = match.status === "IN_PLAY" || match.status === "PAUSED";
  const isFinished  = match.status === "FINISHED";
  const isScheduled = match.status === "SCHEDULED" || match.status === "TIMED";
  const hasScore    = score.fullTime.home !== null && score.fullTime.away !== null;
  const hasDetail   = (goals && goals.length > 0) || (bookings && bookings.length > 0);
  const label       = group
    ? group.replace("_", " ")
    : stage.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  const homeWon = score.winner === "HOME_TEAM";
  const awayWon = score.winner === "AWAY_TEAM";
  const homeLeading = isLive && score.fullTime.home !== null && score.fullTime.away !== null && score.fullTime.home > score.fullTime.away;
  const awayLeading = isLive && score.fullTime.home !== null && score.fullTime.away !== null && score.fullTime.away > score.fullTime.home;

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
          href={homeTeam.id ? `/${locale}/teams/${homeTeam.id}` : "#"}
          className="flex flex-col items-center gap-1.5 flex-1 hover:opacity-80 transition-opacity"
        >
          <TeamCrest crest={homeTeam.crest} name={homeTeam.name} size={40} />
          <span className="text-sm font-semibold text-center leading-tight">
            {homeTeam.shortName ?? "TBD"}
          </span>
          {isFinished && homeWon && <span className="text-[10px] text-bee-yellow">▲ Winner</span>}
          {homeLeading && <span className="text-[10px] text-bee-green">▲ Winning</span>}
          {hasDetail && goals && <GoalsList goals={goals} teamId={homeTeam.id} />}
          {hasDetail && bookings && <BookingsList bookings={bookings} teamId={homeTeam.id} />}
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

          {/* Timezone / AET / Pen */}
          <span className="text-[10px] text-gray-600">
            {isFinished && score.duration !== "REGULAR"
              ? score.duration === "PENALTY_SHOOTOUT" ? "Pen" : "AET"
              : isScheduled
              ? localTz()
              : ""}
          </span>
        </div>

        {/* Away */}
        <Link
          href={awayTeam.id ? `/${locale}/teams/${awayTeam.id}` : "#"}
          className="flex flex-col items-center gap-1.5 flex-1 hover:opacity-80 transition-opacity"
        >
          <TeamCrest crest={awayTeam.crest} name={awayTeam.name} size={40} />
          <span className="text-sm font-semibold text-center leading-tight">
            {awayTeam.shortName ?? "TBD"}
          </span>
          {isFinished && awayWon && <span className="text-[10px] text-bee-yellow">▲ Winner</span>}
          {awayLeading && <span className="text-[10px] text-bee-green">▲ Winning</span>}
          {hasDetail && goals && <GoalsList goals={goals} teamId={awayTeam.id} />}
          {hasDetail && bookings && <BookingsList bookings={bookings} teamId={awayTeam.id} />}
        </Link>
      </div>
    </div>
  );
}
