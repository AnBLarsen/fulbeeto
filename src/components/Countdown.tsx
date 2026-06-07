"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { openChat } from "@/lib/chat-events";
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
      <div className="bg-white/10 border border-bee-yellow/20 rounded-xl px-3 py-2 sm:px-4 sm:py-3 min-w-[58px] sm:min-w-[72px] text-center">
        <span className="text-3xl sm:text-4xl font-black text-bee-yellow tabular-nums">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest">{label}</span>
    </div>
  );
}

export function Countdown({ openingMatch }: CountdownProps) {
  const t = useTranslations("countdown");
  // Stable timestamp — avoids new Date() creating a new object on every render
  const targetMs = openingMatch ? new Date(openingMatch.utcDate).getTime() : null;
  const [time, setTime] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [started, setStarted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!targetMs || targetMs <= Date.now()) {
      setStarted(true);
      return;
    }
    setTime(getTimeLeft(new Date(targetMs)));
    const interval = setInterval(() => {
      const t = getTimeLeft(new Date(targetMs));
      setTime(t);
      if (t.days === 0 && t.hours === 0 && t.minutes === 0 && t.seconds === 0) {
        setStarted(true);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [targetMs]); // stable number, won't change on re-render

  const kickoffDate = targetMs
    ? new Date(targetMs).toLocaleDateString([], { month: "short", day: "numeric" })
    : null;

  const venue = openingMatch
    ? `${openingMatch.homeTeam.name} vs ${openingMatch.awayTeam.name}`
    : null;

  // Render nothing until client-side hydration is complete
  if (!mounted) return null;

  if (started) {
    return (
      <div className="text-center py-12 px-4">
        <Image src="/bee.png" alt="Bee" width={64} height={64} className="mx-auto mb-4" />
        <p className="text-2xl font-black text-bee-yellow">{t("started")}</p>
        <p className="text-gray-400 mt-2 text-sm">{t("startedSub")}</p>
      </div>
    );
  }

  return (
    <div className="py-8 px-2 space-y-6 sm:space-y-8">
      {/* Hero image */}
      <div className="flex justify-center">
        <Image
          src="/hero.png"
          alt="FulBee.TO"
          width={320}
          height={320}
          className="w-full max-w-[260px] sm:max-w-xs drop-shadow-2xl"
          loading="lazy"
        />
      </div>

      {/* Text */}
      <div className="text-center space-y-1">
        <h2 className="text-xl sm:text-2xl font-black text-bee-yellow">{t("warmingUp")}</h2>
        <p className="text-gray-400 text-sm">{t("soon")} 🏆</p>
      </div>

      {/* Countdown */}
      <div className="flex justify-center gap-2 sm:gap-4">
        <Unit value={time.days} label={t("days")} />
        <div className="text-2xl sm:text-3xl font-black text-bee-yellow/40 self-start pt-2.5">:</div>
        <Unit value={time.hours} label={t("hours")} />
        <div className="text-2xl sm:text-3xl font-black text-bee-yellow/40 self-start pt-2.5">:</div>
        <Unit value={time.minutes} label={t("mins")} />
        <div className="text-2xl sm:text-3xl font-black text-bee-yellow/40 self-start pt-2.5">:</div>
        <Unit value={time.seconds} label={t("secs")} />
      </div>

      {/* Opening match */}
      {venue && kickoffDate && (
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-gray-300 text-center">
            <span>⚽</span>
            <span>
              {t("openingMatch")} · <span className="text-white font-semibold">{kickoffDate}</span> · {venue}
            </span>
          </div>
        </div>
      )}

      <button
        onClick={openChat}
        className="mx-auto block text-xs text-gray-500 hover:text-bee-yellow transition-colors underline underline-offset-2"
      >
        {t("beebotHint")} ↘
      </button>
    </div>
  );
}
