"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useState } from "react";

import { useStocksData } from "@/hooks/use-stocks-data";
import { cn } from "@/lib/utils";
import { stocksApi } from "@/lib/stocks/api";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const SCOPES = [
  { value: "combined", label: "Combined" },
  { value: "historical", label: "Historical sim" },
  { value: "live", label: "Live" },
] as const;

const SERIES_META: Record<string, { name: string; color: string; dash: number }> = {
  council: { name: "LLM Council", color: "#5750F1", dash: 0 },
  spy: { name: "S&P 500 (SPY)", color: "#0ABEF9", dash: 6 },
  equal_weight: { name: "Equal-weight 7", color: "#F59E0B", dash: 6 },
};

export function EquityCurve() {
  const [scope, setScope] = useState<string>("combined");
  const { data, error, loading } = useStocksData(
    () => stocksApi.portfolio(scope),
    [scope],
  );

  const series = Object.entries(data?.series ?? {})
    .filter(([key]) => SERIES_META[key])
    .map(([key, points]) => ({
      name: SERIES_META[key].name,
      data: points ?? [],
    }));
  const keys = Object.keys(data?.series ?? {}).filter((k) => SERIES_META[k]);
  const showsBackfill = (data?.kinds_included ?? []).some((k) =>
    ["historical", "demo", "dry_run"].includes(k),
  );

  const options: ApexOptions = {
    legend: { show: true, position: "top", horizontalAlign: "left" },
    colors: keys.map((k) => SERIES_META[k].color),
    chart: {
      height: 340,
      type: "line",
      toolbar: { show: false },
      fontFamily: "inherit",
      animations: { enabled: false },
    },
    stroke: {
      curve: "straight",
      width: keys.map((k) => (k === "council" ? 3 : 2)),
      dashArray: keys.map((k) => SERIES_META[k].dash),
    },
    grid: { strokeDashArray: 5, yaxis: { lines: { show: true } } },
    dataLabels: { enabled: false },
    xaxis: {
      type: "datetime",
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { formatter: (v) => v.toFixed(0) },
      title: { text: "Equity (start = 100)" },
    },
    tooltip: {
      x: { format: "dd MMM yyyy" },
      y: { formatter: (v) => v.toFixed(2) },
    },
  };

  return (
    <div className="grid gap-2 rounded-[10px] bg-white px-7.5 pb-6 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-body-2xlg font-bold text-dark dark:text-white">
          Council Portfolio vs Benchmarks
        </h2>

        <div className="flex gap-1 rounded-lg bg-gray-2 p-1 dark:bg-dark-2">
          {SCOPES.map((s) => (
            <button
              key={s.value}
              onClick={() => setScope(s.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium",
                scope === s.value
                  ? "bg-white text-dark shadow-1 dark:bg-gray-dark dark:text-white"
                  : "text-dark-6 hover:text-dark dark:hover:text-white",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {showsBackfill && (
        <p className="rounded-lg border border-amber-400/40 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:bg-amber-400/10 dark:text-amber-300">
          The backfilled portion is a <strong>hindsight-biased simulation</strong>:
          model knowledge cutoffs postdate these dates, even though each run was
          fed only point-in-time price data. Treat live forward results as the
          honest track record.
        </p>
      )}

      {error && (
        <p className="py-10 text-center text-sm text-red">
          Could not load portfolio data: {error}. Is the backend running on
          port 8001?
        </p>
      )}

      {!error && !loading && series.length === 0 && (
        <p className="py-10 text-center text-sm text-dark-6">
          No completed council runs yet — press “Run council now” or seed demo
          data with <code>python -m backend.stocks.seed_demo</code>.
        </p>
      )}

      {series.length > 0 && (
        <div className="-ml-4 -mr-5">
          <Chart options={options} series={series} type="line" height={340} />
        </div>
      )}
    </div>
  );
}
