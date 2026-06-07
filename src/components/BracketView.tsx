"use client";

import Image from "next/image";
import Link from "next/link";
import type { FDMatch } from "@/types/football";
import { normaliseStage } from "@/lib/football-api";

// ─── Bracket config ───────────────────────────────────────────────────────────

/** Ordered knockout rounds, left → right */
const BRACKET_ROUNDS = [
  { stage: "ROUND_OF_32",   label: "Round of 32",   slots: 16 },
  { stage: "ROUND_OF_16",   label: "Round of 16",   slots: 8  },
  { stage: "QUARTER_FINALS",label: "Quarter-finals", slots: 4  },
  { stage: "SEMI_FINALS",   label: "Semi-finals",    slots: 2  },
  { stage: "FINAL",         label: "Final",          slots: 1  },
] as const;

const MATCH_W   = 168;  // px — match card width
const MATCH_H   = 76;   // px — match card height
const COL_GAP   = 52;   // px — horizontal gap between columns
const UNIT_H    = 88;   // px — vertical space per R32 slot (determines row density)
const HEADER_H  = 36;   // px — round label row above bracket
const COL_W     = MATCH_W + COL_GAP;

// Total SVG canvas dimensions
const TOTAL_H   = 16 * UNIT_H;        // height for 16 R32 slots
const TOTAL_W   = BRACKET_ROUNDS.length * COL_W - COL_GAP + 120; // extra for 3rd-place

// ─── Helpers ──────────────────────────────────────────────────────────────────

function roundIndex(stage: string): number {
  return BRACKET_ROUNDS.findIndex((r) => r.stage === stage);
}

/** Vertical center of match j in round r (0-indexed) */
function matchCenterY(roundIdx: number, matchIdx: number): number {
  const slotSpan = Math.pow(2, roundIdx); // slots this round's match spans
  return (matchIdx * slotSpan + slotSpan / 2) * UNIT_H;
}

function matchX(roundIdx: number): number {
  return roundIdx * COL_W;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TBDTeam({ size = 28 }: { size?: number }) {
  return (
    <div
      className="rounded-full bg-white/10 flex items-center justify-center text-[10px] text-gray-500 font-bold shrink-0"
      style={{ width: size, height: size }}
    >
      ?
    </div>
  );
}

function TeamCrest({ crest, name, size = 28 }: { crest: string; name: string; size?: number }) {
  if (!crest) {
    return (
      <div
        className="rounded-full bg-gray-700 flex items-center justify-center text-[9px] text-gray-400 font-bold shrink-0"
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
      className="object-contain shrink-0"
      unoptimized
    />
  );
}

interface MatchRowProps {
  teamId?: number;
  crest?: string;
  name?: string;
  score: number | null;
  isWinner: boolean;
  isLive: boolean;
}

function MatchRow({ teamId, crest, name, score, isWinner, isLive }: MatchRowProps) {
  const content = (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
        isWinner ? "bg-bee-yellow/15" : "hover:bg-white/5"
      }`}
    >
      {name ? (
        <TeamCrest crest={crest ?? ""} name={name} size={22} />
      ) : (
        <TBDTeam size={22} />
      )}
      <span
        className={`flex-1 text-[11px] font-semibold truncate ${
          isWinner ? "text-bee-yellow" : name ? "text-white" : "text-gray-600"
        }`}
      >
        {name ?? "TBD"}
      </span>
      <span
        className={`text-sm font-black tabular-nums w-5 text-right ${
          isWinner ? "text-bee-yellow" : isLive ? "text-bee-green" : "text-gray-400"
        }`}
      >
        {score !== null ? score : ""}
      </span>
    </div>
  );

  if (teamId && name) {
    return (
      <Link href={`/teams/${teamId}`} className="block">
        {content}
      </Link>
    );
  }
  return content;
}

interface MatchCardProps {
  match?: FDMatch; // undefined = pure TBD slot
  roundIdx: number;
  matchIdx: number;
}

function MatchCard({ match, roundIdx, matchIdx }: MatchCardProps) {
  const cx = matchX(roundIdx);
  const cy = matchCenterY(roundIdx, matchIdx);

  const isLive = match?.status === "IN_PLAY" || match?.status === "PAUSED";
  const isFinished = match?.status === "FINISHED";
  const homeWon = match?.score.winner === "HOME_TEAM";
  const awayWon = match?.score.winner === "AWAY_TEAM";
  const hasScore = match?.score.fullTime.home !== null && match?.score.fullTime.away !== null;

  const borderColor = isLive
    ? "border-bee-green/60"
    : isFinished
    ? "border-white/15"
    : "border-white/10";

  const kickoffTime = match
    ? new Date(match.utcDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <foreignObject
      x={cx}
      y={cy - MATCH_H / 2}
      width={MATCH_W}
      height={MATCH_H}
      style={{ overflow: "visible" }}
    >
      <div
        // @ts-expect-error — xmlns required for foreignObject
        xmlns="http://www.w3.org/1999/xhtml"
        className={`bee-stripes rounded-lg border ${borderColor} bg-bee-black/90 flex flex-col justify-between overflow-hidden`}
        style={{ width: MATCH_W, height: MATCH_H }}
      >
        {/* Top bar: status / time */}
        <div className="flex items-center justify-between px-2 pt-1 pb-0.5">
          {isLive ? (
            <span className="flex items-center gap-1 text-[9px] font-semibold text-bee-green animate-pulse-slow">
              <span className="w-1 h-1 rounded-full bg-bee-green inline-block" />
              {match?.status === "PAUSED" ? "HT" : "LIVE"}
            </span>
          ) : isFinished ? (
            <span className="text-[9px] text-gray-500">FT</span>
          ) : kickoffTime ? (
            <span className="text-[9px] text-gray-600">{kickoffTime}</span>
          ) : (
            <span className="text-[9px] text-gray-700">TBD</span>
          )}
          {isFinished && match?.score.duration !== "REGULAR" && (
            <span className="text-[9px] text-gray-600">
              {match?.score.duration === "PENALTY_SHOOTOUT" ? "Pen" : "AET"}
            </span>
          )}
        </div>

        {/* Home row */}
        <MatchRow
          teamId={match?.homeTeam.id}
          crest={match?.homeTeam.crest}
          name={match?.homeTeam.shortName}
          score={hasScore ? match!.score.fullTime.home : null}
          isWinner={homeWon}
          isLive={isLive}
        />

        {/* Away row */}
        <MatchRow
          teamId={match?.awayTeam.id}
          crest={match?.awayTeam.crest}
          name={match?.awayTeam.shortName}
          score={hasScore ? match!.score.fullTime.away : null}
          isWinner={awayWon}
          isLive={isLive}
        />
      </div>
    </foreignObject>
  );
}

// ─── Connector lines ──────────────────────────────────────────────────────────

function BracketConnectors({
  fromRoundIdx,
  matchCount,
}: {
  fromRoundIdx: number;
  matchCount: number;
}) {
  const lines: React.ReactNode[] = [];
  const toRoundIdx = fromRoundIdx + 1;
  const midX = matchX(fromRoundIdx) + MATCH_W + COL_GAP / 2;

  for (let i = 0; i < matchCount; i++) {
    const fromY = matchCenterY(fromRoundIdx, i);
    const toY   = matchCenterY(toRoundIdx, Math.floor(i / 2));
    const toX   = matchX(toRoundIdx);

    lines.push(
      <path
        key={i}
        d={`M ${matchX(fromRoundIdx) + MATCH_W} ${fromY} H ${midX} V ${toY} H ${toX}`}
        fill="none"
        stroke="rgba(245,196,0,0.15)"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    );
  }
  return <>{lines}</>;
}

// ─── Main component ───────────────────────────────────────────────────────────

interface BracketViewProps {
  matches: FDMatch[];
}

export function BracketView({ matches }: BracketViewProps) {
  // Group matches by normalised stage
  const byStage = new Map<string, FDMatch[]>();
  for (const m of matches) {
    const stage = normaliseStage(m.stage);
    if (!byStage.has(stage)) byStage.set(stage, []);
    byStage.get(stage)!.push(m);
  }

  // Determine which rounds are present
  const hasR32 = byStage.has("ROUND_OF_32") && byStage.get("ROUND_OF_32")!.length > 0;
  const activeRounds = hasR32 ? BRACKET_ROUNDS : BRACKET_ROUNDS.slice(1);
  const colCount = activeRounds.length;

  const svgW = colCount * COL_W - COL_GAP;
  const svgMatchH = hasR32 ? TOTAL_H : (8 * UNIT_H);

  // Build match cards for each active round
  function getMatch(stage: string, idx: number): FDMatch | undefined {
    return byStage.get(stage)?.[idx];
  }

  const thirdPlaceMatch = byStage.get("THIRD_PLACE")?.[0];

  // 3rd place sits below the main bracket, offset to align with SF column
  const sfRoundIdx = activeRounds.findIndex((r) => r.stage === "SEMI_FINALS");
  const thirdPlaceX = sfRoundIdx >= 0 ? matchX(sfRoundIdx) : 0;
  const thirdPlaceY = svgMatchH + 24;

  const totalSvgH = svgMatchH + (sfRoundIdx >= 0 ? MATCH_H + 56 : 0);

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div style={{ minWidth: svgW + 8 }}>
        {/* Round labels */}
        <div
          className="flex mb-2"
          style={{ gap: COL_GAP, paddingLeft: 0 }}
        >
          {activeRounds.map((round) => (
            <div
              key={round.stage}
              className="text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider"
              style={{ width: MATCH_W, flexShrink: 0 }}
            >
              {round.label}
            </div>
          ))}
        </div>

        {/* SVG bracket */}
        <svg
          width={svgW}
          height={totalSvgH}
          style={{ display: "block", overflow: "visible" }}
        >
          {/* Connectors */}
          {activeRounds.slice(0, -1).map((round, rIdx) => {
            const stageMatches = byStage.get(round.stage) ?? [];
            const slotCount = round.slots;
            return (
              <BracketConnectors
                key={round.stage}
                fromRoundIdx={rIdx}
                matchCount={Math.max(slotCount, stageMatches.length)}
              />
            );
          })}

          {/* Match cards */}
          {activeRounds.map((round, rIdx) => {
            const slots = round.slots;
            return Array.from({ length: slots }, (_, mIdx) => (
              <MatchCard
                key={`${round.stage}-${mIdx}`}
                match={getMatch(round.stage, mIdx)}
                roundIdx={rIdx}
                matchIdx={mIdx}
              />
            ));
          })}

          {/* 3rd place match — rendered below SF column */}
          {sfRoundIdx >= 0 && (
            <>
              <text
                x={thirdPlaceX}
                y={thirdPlaceY - 8}
                style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, fill: "rgba(156,163,175,0.6)" }}
              >
                3rd Place
              </text>
              <foreignObject
                x={thirdPlaceX}
                y={thirdPlaceY}
                width={MATCH_W}
                height={MATCH_H}
                style={{ overflow: "visible" }}
              >
                <div
                  // @ts-expect-error — xmlns required for foreignObject in SVG
                  xmlns="http://www.w3.org/1999/xhtml"
                  className="bee-stripes rounded-lg border border-white/10 bg-bee-black/90 flex flex-col justify-between overflow-hidden"
                  style={{ width: MATCH_W, height: MATCH_H }}
                >
                  <div className="px-2 pt-1 pb-0.5">
                    {thirdPlaceMatch ? (
                      thirdPlaceMatch.status === "FINISHED" ? (
                        <span className="text-[9px] text-gray-500">FT</span>
                      ) : (
                        <span className="text-[9px] text-gray-600">
                          {new Date(thirdPlaceMatch.utcDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )
                    ) : (
                      <span className="text-[9px] text-gray-700">TBD</span>
                    )}
                  </div>
                  <MatchRow
                    teamId={thirdPlaceMatch?.homeTeam.id}
                    crest={thirdPlaceMatch?.homeTeam.crest}
                    name={thirdPlaceMatch?.homeTeam.shortName}
                    score={thirdPlaceMatch?.score.fullTime.home ?? null}
                    isWinner={thirdPlaceMatch?.score.winner === "HOME_TEAM"}
                    isLive={thirdPlaceMatch?.status === "IN_PLAY"}
                  />
                  <MatchRow
                    teamId={thirdPlaceMatch?.awayTeam.id}
                    crest={thirdPlaceMatch?.awayTeam.crest}
                    name={thirdPlaceMatch?.awayTeam.shortName}
                    score={thirdPlaceMatch?.score.fullTime.away ?? null}
                    isWinner={thirdPlaceMatch?.score.winner === "AWAY_TEAM"}
                    isLive={thirdPlaceMatch?.status === "IN_PLAY"}
                  />
                </div>
              </foreignObject>
            </>
          )}
        </svg>
      </div>
    </div>
  );
}
