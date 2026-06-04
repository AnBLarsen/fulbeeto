import { getStandings } from "@/lib/football-api";
import { StandingsTable } from "@/components/StandingsTable";
import Image from "next/image";
import type { FDStandingsGroup } from "@/types/football";

export const revalidate = 120;

export default async function StandingsPage() {
  let groups: FDStandingsGroup[] = [];
  let error: string | null = null;

  try {
    const data = await getStandings();
    // Keep only TOTAL standings (not HOME/AWAY duplicates) for group stage
    groups = data.standings.filter((s) => s.type === "TOTAL" && s.group !== null);
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load standings";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">
          <span className="text-bee-yellow">Group</span> Standings
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          World Cup 2026 — top 2 from each group advance
        </p>
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

      {!error && groups.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <Image src='/bee.png' alt='Bee' width={64} height={64} className="mx-auto mb-4" />
          <p className="text-lg font-semibold">No standings yet</p>
          <p className="text-sm mt-1">Group stage may not have started. Ask BeeBot for details.</p>
        </div>
      )}

      {!error && groups.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map((g) => (
            <StandingsTable
              key={g.group}
              groupName={g.group ?? "Unknown"}
              entries={g.table}
            />
          ))}
        </div>
      )}
    </div>
  );
}
