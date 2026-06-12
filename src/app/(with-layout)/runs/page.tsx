"use client";

import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStocksData } from "@/hooks/use-stocks-data";
import { cn } from "@/lib/utils";
import { stocksApi, type Stance } from "@/lib/stocks/api";

const STANCE_DOT: Record<Stance, string> = {
  LONG: "bg-green/10 text-green",
  SHORT: "bg-red/10 text-red",
  FLAT: "bg-gray-3 text-dark-5 dark:bg-dark-3 dark:text-dark-6",
};

const KIND_BADGE: Record<string, string> = {
  live: "bg-green/10 text-green",
  historical: "bg-amber-400/15 text-amber-600 dark:text-amber-400",
  demo: "bg-gray-3 text-dark-5 dark:bg-dark-3 dark:text-dark-6",
  dry_run: "bg-blue-light-5 text-blue dark:bg-blue/10",
};

export default function RunsPage() {
  const { data, error, loading } = useStocksData(() => stocksApi.runs());

  return (
    <div className="rounded-[10px] bg-white px-7.5 pb-4 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card">
      <h1 className="mb-1 text-body-2xlg font-bold text-dark dark:text-white">
        Council Runs
      </h1>
      <p className="mb-4 text-sm text-dark-6">
        Every deliberation the council has held. Click a run to read the full
        three-stage transcript.
      </p>

      {error && (
        <p className="py-8 text-center text-sm text-red">
          Could not load runs: {error}
        </p>
      )}
      {loading && !data && (
        <p className="py-8 text-center text-sm text-dark-6">Loading…</p>
      )}
      {data && data.length === 0 && (
        <p className="py-8 text-center text-sm text-dark-6">
          No runs yet — press “Run council now” on the dashboard.
        </p>
      )}

      {data && data.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow className="border-none uppercase [&>th]:text-center">
              <TableHead className="!text-left">As of</TableHead>
              <TableHead>Kind</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="!text-left">Stances</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.map((run) => (
              <TableRow
                key={run.run_id}
                className="text-center text-base font-medium text-dark dark:text-white"
              >
                <TableCell className="!text-left">{run.as_of}</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-sm font-medium",
                      KIND_BADGE[run.kind] ?? KIND_BADGE.demo,
                    )}
                  >
                    {run.kind}
                  </span>
                </TableCell>
                <TableCell
                  className={cn(
                    run.status === "failed" && "text-red",
                    run.status === "running" && "text-amber-500",
                  )}
                >
                  {run.status}
                </TableCell>
                <TableCell className="!text-left">
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(run.stance_summary ?? {}).map(([t, s]) => (
                      <span
                        key={t}
                        className={cn(
                          "rounded px-1.5 py-0.5 text-xs font-bold",
                          STANCE_DOT[s],
                        )}
                        title={`${t}: ${s}`}
                      >
                        {t}
                        {s === "LONG" ? "↑" : s === "SHORT" ? "↓" : "·"}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/runs/${run.run_id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    View →
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
