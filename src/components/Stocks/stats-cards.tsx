"use client";

import { useStocksData } from "@/hooks/use-stocks-data";
import { cn } from "@/lib/utils";
import { stocksApi } from "@/lib/stocks/api";

export function StatsCards() {
  const { data } = useStocksData(() => stocksApi.portfolio("combined"));
  const council = data?.stats?.council;
  const spy = data?.stats?.spy;
  if (!council) return null;

  const vsSpy =
    typeof council.total_return_pct === "number" &&
    typeof spy?.total_return_pct === "number"
      ? council.total_return_pct - spy.total_return_pct
      : null;
  const hitRate =
    typeof council.hit_rate_vs_spy === "number"
      ? `${(council.hit_rate_vs_spy * 100).toFixed(0)}%`
      : "—";

  const cards = [
    {
      label: "Council total return",
      value: pct(council.total_return_pct),
      tone: tone(council.total_return_pct),
    },
    {
      label: "vs S&P 500",
      value: vsSpy != null ? pct(vsSpy) : "—",
      tone: tone(vsSpy),
    },
    {
      label: "Max drawdown",
      value: pct(council.max_drawdown_pct),
      tone: "text-dark dark:text-white",
    },
    {
      label: "Rebalance periods beating SPY",
      value: hitRate,
      tone: "text-dark dark:text-white",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:gap-6">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark"
        >
          <dl>
            <dt className={cn("text-heading-6 font-bold", c.tone)}>{c.value}</dt>
            <dd className="mt-1.5 text-sm font-medium text-dark-6">{c.label}</dd>
          </dl>
        </div>
      ))}
    </div>
  );
}

function pct(v: unknown): string {
  if (typeof v !== "number") return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

function tone(v: unknown): string {
  if (typeof v !== "number") return "text-dark dark:text-white";
  return v >= 0 ? "text-green" : "text-red";
}
