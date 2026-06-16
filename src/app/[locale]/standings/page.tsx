import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { getStandings } from "@/lib/football-api";
import { StandingsTable } from "@/components/StandingsTable";
import type { FDStandingsGroup } from "@/types/football";

export const revalidate = 120;

export default async function StandingsPage() {
  const t = await getTranslations("standings");

  let groups: FDStandingsGroup[] = [];
  let error: string | null = null;

  try {
    const data = await getStandings();
    groups = data.standings.filter((s) => s.type === "TOTAL" && s.group !== null);
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load standings";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">
          {t("title")}
        </h1>
        <p className="text-gray-500 text-sm mt-1">{t("subtitle")}</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <strong>Bzzt.</strong> Could not load standings right now. Try refreshing the page.
        </div>
      )}

      {!error && groups.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <Image src="/bee.png" alt="Bee" width={64} height={64} className="mx-auto mb-4" loading="lazy" />
          <p className="text-lg font-semibold">{t("noStandings")}</p>
          <p className="text-sm mt-1">{t("noStandingsSub")}</p>
        </div>
      )}

      {!error && groups.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map((g) => (
            <StandingsTable key={g.group} groupName={g.group ?? "Unknown"} entries={g.table} />
          ))}
        </div>
      )}
    </div>
  );
}
