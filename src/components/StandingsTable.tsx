import Image from "next/image";
import Link from "next/link";
import type { FDStandingEntry } from "@/types/football";

interface StandingsTableProps {
  groupName: string;
  entries: FDStandingEntry[];
}

function FormDot({ result }: { result: string }) {
  const color =
    result === "W" ? "bg-bee-green" : result === "D" ? "bg-yellow-500" : "bg-red-500";
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} title={result} />;
}

export function StandingsTable({ groupName, entries }: StandingsTableProps) {
  const label = groupName.replace("_", " ");

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <div className="px-4 py-2.5 bg-bee-yellow/10 border-b border-white/10">
        <h3 className="font-bold text-bee-yellow text-sm tracking-wide">{label}</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] text-gray-500 uppercase tracking-wider border-b border-white/5">
              <th className="px-2 py-2 text-left w-5">#</th>
              <th className="px-2 py-2 text-left">Team</th>
              <th className="px-1.5 py-2 text-center">P</th>
              <th className="px-1.5 py-2 text-center">W</th>
              <th className="px-1.5 py-2 text-center hidden xs:table-cell">D</th>
              <th className="px-1.5 py-2 text-center hidden xs:table-cell">L</th>
              <th className="px-1.5 py-2 text-center hidden sm:table-cell">GF</th>
              <th className="px-1.5 py-2 text-center hidden sm:table-cell">GD</th>
              <th className="px-1.5 py-2 text-center font-bold text-white">Pts</th>
              <th className="px-2 py-2 text-left hidden lg:table-cell">Form</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, idx) => {
              const qualified = idx < 2;
              return (
                <tr
                  key={entry.team.id}
                  className={`border-b border-white/5 transition-colors hover:bg-white/5 ${
                    qualified ? "bg-bee-green/5" : ""
                  }`}
                >
                  <td className="px-2 py-2.5">
                    <span className={`text-xs font-bold ${qualified ? "text-bee-green" : "text-gray-500"}`}>
                      {entry.position}
                    </span>
                  </td>
                  <td className="px-2 py-2.5">
                    <Link href={`/teams/${entry.team.id}`} className="flex items-center gap-1.5 hover:text-bee-yellow transition-colors">
                      {entry.team.crest && (
                        <Image
                          src={entry.team.crest}
                          alt={entry.team.name}
                          width={18}
                          height={18}
                          style={{ width: 18, height: 18 }}
                          className="object-contain shrink-0"
                          unoptimized
                        />
                      )}
                      <span className="font-medium text-xs whitespace-nowrap">
                        {entry.team.tla || entry.team.shortName || entry.team.name}
                      </span>
                    </Link>
                  </td>
                  <td className="px-1.5 py-2.5 text-center text-gray-300 text-xs">{entry.playedGames}</td>
                  <td className="px-1.5 py-2.5 text-center text-gray-300 text-xs">{entry.won}</td>
                  <td className="px-1.5 py-2.5 text-center text-gray-300 text-xs hidden xs:table-cell">{entry.draw}</td>
                  <td className="px-1.5 py-2.5 text-center text-gray-300 text-xs hidden xs:table-cell">{entry.lost}</td>
                  <td className="px-1.5 py-2.5 text-center text-gray-300 text-xs hidden sm:table-cell">{entry.goalsFor}</td>
                  <td className={`px-1.5 py-2.5 text-center text-xs font-medium hidden sm:table-cell ${
                    entry.goalDifference > 0 ? "text-bee-green" : entry.goalDifference < 0 ? "text-red-400" : "text-gray-400"
                  }`}>
                    {entry.goalDifference > 0 ? `+${entry.goalDifference}` : entry.goalDifference}
                  </td>
                  <td className="px-1.5 py-2.5 text-center font-black text-bee-yellow text-sm">{entry.points}</td>
                  <td className="px-2 py-2.5 hidden lg:table-cell">
                    <div className="flex gap-0.5">
                      {(entry.form ?? "").split(",").slice(-5).map((r, i) => (
                        <FormDot key={i} result={r.trim()} />
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
