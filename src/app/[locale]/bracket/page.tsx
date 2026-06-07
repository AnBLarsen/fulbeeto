import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { getKnockoutMatches, normaliseStage } from "@/lib/football-api";
import { BracketMatchCard } from "@/components/BracketMatchCard";
import type { FDMatch } from "@/types/football";

export const revalidate = 60;

// Display order for stages
const STAGE_ORDER = [
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINALS",
  "SEMI_FINALS",
  "THIRD_PLACE",
  "FINAL",
];

// Label key in translations
const STAGE_KEY: Record<string, string> = {
  ROUND_OF_32: "last32",
  ROUND_OF_16: "last16",
  QUARTER_FINALS: "qf",
  SEMI_FINALS: "sf",
  THIRD_PLACE: "third",
  FINAL: "final",
};

// Grid columns per stage
const STAGE_COLS: Record<string, string> = {
  ROUND_OF_32: "sm:grid-cols-2 lg:grid-cols-4",
  ROUND_OF_16: "sm:grid-cols-2 lg:grid-cols-4",
  QUARTER_FINALS: "sm:grid-cols-2 lg:grid-cols-4",
  SEMI_FINALS: "sm:grid-cols-2",
  THIRD_PLACE: "sm:grid-cols-1 max-w-sm",
  FINAL: "sm:grid-cols-1 max-w-sm",
};

export default async function BracketPage() {
  const t = await getTranslations("bracket");

  let matches: FDMatch[] = [];
  let error: string | null = null;

  try {
    matches = await getKnockoutMatches();
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load bracket";
  }

  // Group matches by normalised stage
  const byStage = new Map<string, FDMatch[]>();
  for (const m of matches) {
    const key = normaliseStage(m.stage);
    if (!byStage.has(key)) byStage.set(key, []);
    byStage.get(key)!.push(m);
  }

  const hasKnockout = byStage.size > 0;

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white">{t("title")}</h1>
        <p className="text-gray-500 text-sm mt-1">{t("subtitle")}</p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <strong>Bzzt.</strong> {error}
          <p className="mt-1 text-xs text-gray-500">
            Check that{" "}
            <code className="bg-white/10 px-1 rounded">FOOTBALL_DATA_KEY</code>{" "}
            is set in{" "}
            <code className="bg-white/10 px-1 rounded">.env.local</code>.
          </p>
        </div>
      )}

      {/* Coming soon */}
      {!error && !hasKnockout && (
        <div className="text-center py-20 text-gray-500">
          <Image
            src="/bee.png"
            alt="Bee"
            width={64}
            height={64}
            className="mx-auto mb-4 opacity-60"
            loading="lazy"
          />
          <p className="text-lg font-semibold text-gray-300">{t("coming")}</p>
          <p className="text-sm mt-1 max-w-sm mx-auto">{t("comingSub")}</p>
        </div>
      )}

      {/* Rounds */}
      {!error && hasKnockout && (
        <div className="space-y-10">
          {STAGE_ORDER.filter((s) => byStage.has(s)).map((stage) => {
            const roundMatches = byStage.get(stage)!;
            const isFinalStage = stage === "FINAL";
            const cols = STAGE_COLS[stage] ?? "sm:grid-cols-2";
            const labelKey = STAGE_KEY[stage];

            return (
              <section key={stage}>
                {/* Round header */}
                <div className="flex items-center gap-3 mb-4">
                  <h2
                    className={`text-lg font-black ${
                      isFinalStage ? "text-bee-yellow" : "text-white"
                    }`}
                  >
                    {isFinalStage ? "🏆 " : ""}
                    {t(labelKey as Parameters<typeof t>[0])}
                  </h2>
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-xs text-gray-500">
                    {roundMatches.length}{" "}
                    {roundMatches.length === 1 ? t("match") : t("matches")}
                  </span>
                </div>

                {/* Match grid */}
                <div
                  className={`grid grid-cols-1 gap-3 ${cols} ${
                    isFinalStage || stage === "THIRD_PLACE" ? "mx-auto" : ""
                  }`}
                >
                  {roundMatches.map((m) => (
                    <BracketMatchCard
                      key={m.id}
                      match={m}
                      tbd={t("tbd")}
                      isFinal={isFinalStage}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
