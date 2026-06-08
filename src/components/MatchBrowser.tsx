"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { FDMatch } from "@/types/football";
import { FixtureCard } from "./FixtureCard";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Local-date string YYYY-MM-DD for today */
function todayLocal(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

/** Build a continuous list of date strings between two YYYY-MM-DD strings (inclusive) */
function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  const cur = new Date(sy, sm - 1, sd);
  const last = new Date(ey, em - 1, ed);
  while (cur <= last) {
    dates.push(
      [
        cur.getFullYear(),
        String(cur.getMonth() + 1).padStart(2, "0"),
        String(cur.getDate()).padStart(2, "0"),
      ].join("-")
    );
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

/** Local date of a match, converted from its UTC timestamp */
function matchDate(m: FDMatch): string {
  const d = new Date(m.utcDate);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

/** Sorted unique group names from a match list */
function deriveGroups(matches: FDMatch[]): string[] {
  const seen = new Set<string>();
  for (const m of matches) if (m.group) seen.add(m.group);
  return [...seen].sort();
}

type FmtDay = { dow: string; day: string; month: string; showMonth: boolean };

function fmtDay(dateStr: string, prevDateStr: string | null, locale: string): FmtDay {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const month = date.toLocaleDateString(locale, { month: "short" });
  const prevMonth = prevDateStr
    ? new Date(
        +prevDateStr.slice(0, 4),
        +prevDateStr.slice(5, 7) - 1,
        +prevDateStr.slice(8, 10)
      ).toLocaleDateString(locale, { month: "short" })
    : null;

  return {
    dow:       date.toLocaleDateString(locale, { weekday: "short" }),
    day:       String(d),
    month,
    showMonth: month !== prevMonth,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

type ViewMode = "date" | "group";

interface MatchBrowserProps {
  initialDate?: string;
}

export function MatchBrowser({ initialDate }: MatchBrowserProps) {
  const t      = useTranslations("browser");
  const locale = useLocale();

  const [allMatches, setAllMatches]       = useState<FDMatch[] | null>(null);
  const [error, setError]                 = useState<string | null>(null);
  const [retryCount, setRetryCount]       = useState(0);
  const [mode, setMode]                   = useState<ViewMode>("date");
  const [selectedDate, setSelectedDate]   = useState<string>(initialDate ?? todayLocal());
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  // ── Fetch all tournament matches once ──────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setAllMatches(null);
    setError(null);
    fetch("/api/matches", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json() as Promise<FDMatch[]>;
      })
      .then((data) => {
        if (cancelled) return;
        // If API returned empty, treat it as an error so user can retry
        if (!data.length) throw new Error("empty");
        setAllMatches(data);

        // Default group selection
        const groups = deriveGroups(data);
        if (groups.length) setSelectedGroup((p) => p ?? groups[0]);

        // Snap selected date to a day that actually has matches
        const matchDays = new Set(data.map(matchDate));
        const sorted = [...matchDays].sort();
        const first = sorted[0];
        const last  = sorted[sorted.length - 1];
        const today = todayLocal();

        if (!matchDays.has(today)) {
          if (today < first) {
            // Before tournament: go to first match day
            setSelectedDate(first);
          } else if (today > last) {
            // After tournament: go to last match day
            setSelectedDate(last);
          } else {
            // Rest day during tournament: go to next upcoming match day
            const next = sorted.find((d) => d > today);
            setSelectedDate(next ?? last);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setError(t("error"));
      });
    return () => { cancelled = true; };
  }, [retryCount]);

  // ── Auto-refresh every 60 s while any match is live ───────────────────────
  useEffect(() => {
    if (!allMatches) return;
    const live = allMatches.some(
      (m) => m.status === "IN_PLAY" || m.status === "PAUSED"
    );
    if (!live) return;
    const id = setInterval(() => {
      fetch("/api/matches", { cache: "no-store" })
        .then((r) => r.ok ? r.json() : null)
        .then((data) => { if (data) setAllMatches(data); })
        .catch(() => {});
    }, 60_000);
    return () => clearInterval(id);
  }, [allMatches]);

  // ── Scroll selected date into view ────────────────────────────────────────
  useEffect(() => {
    if (mode !== "date" || !stripRef.current) return;
    stripRef.current
      .querySelector<HTMLElement>(`[data-date="${selectedDate}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [selectedDate, mode, allMatches]);

  // ── Derived — everything from data, nothing hardcoded ─────────────────────
  const loading = !allMatches && !error;

  // Full ordered date list covering the entire tournament
  const allDates: string[] = (() => {
    if (!allMatches?.length) return [];
    const sorted = allMatches.map(matchDate).sort();
    return dateRange(sorted[0], sorted[sorted.length - 1]);
  })();

  const groups = deriveGroups(allMatches ?? []);

  const displayMatches = (allMatches ?? []).filter((m) =>
    mode === "group" && selectedGroup
      ? m.group === selectedGroup
      : matchDate(m) === selectedDate
  );

  const anyLive = (allMatches ?? []).some(
    (m) => m.status === "IN_PLAY" || m.status === "PAUSED"
  );

  const today = todayLocal();

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Mode toggle + live badge */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-0.5 bg-white/5 border border-white/10 rounded-full p-0.5">
          {(["date", "group"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                mode === m
                  ? "bg-bee-yellow text-bee-black"
                  : "text-gray-500 hover:text-white"
              }`}
            >
              {m === "date" ? t("byDate") : t("byGroup")}
            </button>
          ))}
        </div>

        {anyLive && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-bee-green animate-pulse-slow">
            <span className="w-1.5 h-1.5 rounded-full bg-bee-green inline-block" />
            {t("live")}
          </span>
        )}
      </div>

      {/* Date strip */}
      {mode === "date" && (
        <div
          ref={stripRef}
          className="flex gap-1.5 overflow-x-auto"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
        >
          {allDates.map((date, i) => {
            const { dow, day, month, showMonth } = fmtDay(date, i > 0 ? allDates[i - 1] : null, locale);
            const isSelected = date === selectedDate;
            const isToday    = date === today;

            return (
              <button
                key={date}
                data-date={date}
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center shrink-0 rounded-xl px-2.5 py-2 min-w-[48px] transition-all ${
                  isSelected
                    ? "bg-bee-yellow text-bee-black"
                    : isToday
                    ? "border border-bee-yellow/40 text-white bg-white/5"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className={`text-[9px] font-bold uppercase tracking-wide ${isSelected ? "text-bee-black/60" : "text-gray-500"}`}>
                  {dow}
                </span>
                <span className="text-[15px] font-black leading-tight">{day}</span>
                <span className={`text-[9px] font-semibold h-3 ${isSelected ? "text-bee-black/50" : "text-gray-600"}`}>
                  {showMonth ? month : ""}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Group tabs */}
      {mode === "group" && groups.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {groups.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGroup(g)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                selectedGroup === g
                  ? "bg-bee-yellow text-bee-black"
                  : "bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {g.replace(/^GROUP_/, t("group") + " ")}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-14 text-gray-500 text-sm gap-2">
          <span className="inline-block animate-spin text-xl" style={{ animationDuration: "1.2s" }}>⚽</span>
          {t("loading")}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-14">
          <p className="text-gray-500 text-sm">{t("error")}</p>
          <button
            onClick={() => setRetryCount((n) => n + 1)}
            className="px-4 py-2 rounded-xl bg-bee-yellow text-bee-black text-xs font-bold hover:bg-yellow-400 transition-colors"
          >
            ↺ Retry
          </button>
        </div>
      ) : displayMatches.length === 0 ? (
        <div className="text-center py-14">
          <p className="text-gray-500 text-sm">{t("noMatches")}</p>
          <p className="text-gray-600 text-xs mt-1">{t("noMatchesSub")}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {displayMatches.map((m) => (
            <FixtureCard key={m.id} match={m} />
          ))}
        </div>
      )}
    </div>
  );
}
