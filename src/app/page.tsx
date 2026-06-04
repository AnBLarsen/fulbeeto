import { getFixtures, getOpeningMatch } from "@/lib/football-api";
import { FixtureCard } from "@/components/FixtureCard";
import Image from "next/image";
import { Countdown } from "@/components/Countdown";
import type { FDMatch } from "@/types/football";

export const revalidate = 60;

export default async function FixturesPage() {
  let fixtures: FDMatch[] = [];
  let error: string | null = null;
  let openingMatch = null;

  try {
    fixtures = await getFixtures();
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load fixtures";
  }

  if (!error && fixtures.length === 0) {
    try {
      openingMatch = await getOpeningMatch();
    } catch { /* non-critical, countdown still renders */ }
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">
            <span className="text-bee-yellow">World Cup</span> Fixtures
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-bee-yellow font-bold text-lg">{today}</span>
            <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">Today</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400 bg-white/5 rounded-xl px-3 py-2">
          <Image src='/bee.png' alt='Bee' width={20} height={20} loading="lazy" />
          <span>BeeBot knows all — ask it anything ↘</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <strong>Bzzt.</strong> {error}
          <p className="mt-1 text-xs text-gray-500">
            Check that <code className="bg-white/10 px-1 rounded">FOOTBALL_DATA_KEY</code> is set in{" "}
            <code className="bg-white/10 px-1 rounded">.env.local</code>.
          </p>
        </div>
      )}

      {/* Empty — show countdown with API-sourced opening match */}
      {!error && fixtures.length === 0 && <Countdown openingMatch={openingMatch} />}

      {/* Fixtures grid */}
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
