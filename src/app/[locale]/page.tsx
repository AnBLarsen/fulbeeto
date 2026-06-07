import { getTranslations } from "next-intl/server";
import { getFixtures, getOpeningMatch } from "@/lib/football-api";
import { FixtureCard } from "@/components/FixtureCard";
import Image from "next/image";
import { Countdown } from "@/components/Countdown";
import { OpenChatHint } from "@/components/OpenChatHint";
import type { FDMatch } from "@/types/football";

export const revalidate = 60;

export default async function FixturesPage() {
  const t = await getTranslations("games");

  let fixtures: FDMatch[] = [];
  let error: string | null = null;
  let openingMatch = null;

  try {
    fixtures = await getFixtures();
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load games";
  }

  if (!error && fixtures.length === 0) {
    try {
      openingMatch = await getOpeningMatch();
    } catch { /* non-critical */ }
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-white">{t("title")}</h1>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-bee-yellow font-bold text-base sm:text-lg">{today}</span>
            <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{t("today")}</span>
          </div>
          <OpenChatHint className="flex items-center gap-1.5 text-xs text-gray-500 bg-white/5 hover:bg-white/10 rounded-lg px-2.5 py-1.5">
            <Image src='/ball.png' alt='Soccer ball' width={16} height={16} loading="lazy" />
            <span className="hidden sm:inline">{t("beebotHint")} ↘</span>
            <span className="sm:hidden">Ask BeeBot ↘</span>
          </OpenChatHint>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <strong>Bzzt.</strong> {error}
          <p className="mt-1 text-xs text-gray-500">
            Check that <code className="bg-white/10 px-1 rounded">FOOTBALL_DATA_KEY</code> is set in{" "}
            <code className="bg-white/10 px-1 rounded">.env.local</code>.
          </p>
        </div>
      )}

      {!error && fixtures.length === 0 && <Countdown openingMatch={openingMatch} />}

      {!error && fixtures.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {fixtures.map((match) => (
            <FixtureCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
