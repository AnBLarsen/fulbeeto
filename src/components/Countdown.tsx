"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { FDMatch } from "@/types/football";

interface CountdownProps {
  openingMatch: FDMatch | null;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(target: Date): TimeLeft {
  const diff = Math.max(0, target.getTime() - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="bg-white/10 border border-bee-yellow/20 rounded-xl px-4 py-3 min-w-[72px] text-center">
        <span className="text-4xl font-black text-bee-yellow tabular-nums">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-xs text-gray-500 uppercase tracking-widest">{label}</span>
    </div>
  );
}

export function Countdown({ openingMatch }: CountdownProps) {
  const target = openingMatch ? new Date(openingMatch.utcDate) : null;
  const [time, setTime] = useState<TimeLeft>(
    target ? getTimeLeft(target) : { days: 0, hours: 0, minutes: 0, seconds: 0 }
  );
  const [started, setStarted] = useState(!target || target.getTime() <= Date.now());

  useEffect(() => {
    if (!target || target.getTime() <= Date.now()) {
      setStarted(true);
      return;
    }
    const interval = setInterval(() => {
      const t = getTimeLeft(target);
      setTime(t);
      if (t.days === 0 && t.hours === 0 && t.minutes === 0 && t.seconds === 0) {
        setStarted(true);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [target]);

  const kickoffDate = target
    ? target.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  const venue = openingMatch
    ? `${openingMatch.homeTeam.name} vs ${openingMatch.awayTeam.name}`
    : null;

  if (started) {
    return (
      <div className="text-center py-16">
        <Image src='/bee.png' alt='Bee' width={64} height={64} className="mx-auto mb-4" loading="lazy" />
        <p className="text-2xl font-black text-bee-yellow">It&apos;s time! 🎉</p>
        <p className="text-gray-400 mt-2">The World Cup is underway — check back soon for today&apos;s fixtures.</p>
      </div>
    );
  }

  return (
    <div className="text-center py-12 space-y-8">
      <div className="flex flex-col items-center gap-3">
        <Image src='/bee.png' alt='Bee' width={96} height={96} className="drop-shadow-lg" loading="lazy" />
        <div>
          <h2 className="text-2xl font-black text-white">
            The Hive is <span className="text-bee-yellow">warming up</span>
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            No matches today — but the World Cup is almost here 🏆
          </p>
        </div>
      </div>

      {/* Countdown */}
      <div className="flex justify-center gap-3 sm:gap-4">
        <Unit value={time.days} label="Days" />
        <div className="text-3xl font-black text-bee-yellow/40 self-start pt-3">:</div>
        <Unit value={time.hours} label="Hours" />
        <div className="text-3xl font-black text-bee-yellow/40 self-start pt-3">:</div>
        <Unit value={time.minutes} label="Mins" />
        <div className="text-3xl font-black text-bee-yellow/40 self-start pt-3">:</div>
        <Unit value={time.seconds} label="Secs" />
      </div>

      {/* Opening match info from API */}
      {venue && kickoffDate && (
        <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-sm text-gray-300">
          <span>⚽</span>
          <span>
            Opening match · <span className="text-white font-semibold">{kickoffDate}</span> · {venue}
          </span>
        </div>
      )}

      <p className="text-xs text-gray-600">
        Ask BeeBot about groups, teams, or predictions while you wait ↘
      </p>
    </div>
  );
}
