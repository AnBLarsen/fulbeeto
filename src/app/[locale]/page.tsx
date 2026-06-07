import { getTranslations } from "next-intl/server";
import { getOpeningMatch } from "@/lib/football-api";
import Image from "next/image";
import { Countdown } from "@/components/Countdown";
import { OpenChatHint } from "@/components/OpenChatHint";
import { MatchBrowser } from "@/components/MatchBrowser";

export const revalidate = 60;

// WC 2026 start — only show countdown before this date
const WC_START = "2026-06-11";

function todayStr(): string {
  const d = new Date();
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()]
    .map((n, i) => (i === 0 ? n : String(n).padStart(2, "0")))
    .join("-");
}

export default async function FixturesPage() {
  const t = await getTranslations("games");
  const today = todayStr();
  const preTournament = today < WC_START;

  let openingMatch = null;
  if (preTournament) {
    try { openingMatch = await getOpeningMatch(); } catch { /* non-critical */ }
  }

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div className="space-y-5 sm:space-y-7">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-white">{t("title")}</h1>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-bee-yellow font-bold text-base sm:text-lg">{todayLabel}</span>
            <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{t("today")}</span>
          </div>
          <OpenChatHint className="flex items-center gap-1.5 text-xs text-gray-500 bg-white/5 hover:bg-white/10 rounded-lg px-2.5 py-1.5">
            <Image src="/ball.png" alt="Soccer ball" width={16} height={16} loading="lazy" />
            <span className="hidden sm:inline">{t("beebotHint")} ↘</span>
            <span className="sm:hidden">Ask BeeBot ↘</span>
          </OpenChatHint>
        </div>
      </div>

      {/* Countdown — only shown before the tournament kicks off */}
      {preTournament && <Countdown openingMatch={openingMatch} />}

      {/* Match browser — date strip + group tabs + live match cards */}
      <MatchBrowser initialDate={today} />
    </div>
  );
}
