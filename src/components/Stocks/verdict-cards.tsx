"use client";

import Link from "next/link";

import { useStocksData } from "@/hooks/use-stocks-data";
import { cn } from "@/lib/utils";
import {
  stocksApi,
  type LatestPrice,
  type Stance,
  type StockVerdict,
} from "@/lib/stocks/api";

const STANCE_STYLES: Record<Stance, string> = {
  LONG: "bg-green/10 text-green",
  SHORT: "bg-red/10 text-red",
  FLAT: "bg-gray-3 text-dark-5 dark:bg-dark-3 dark:text-dark-6",
};

export function VerdictCards() {
  const verdicts = useStocksData(() => stocksApi.latestVerdicts());
  const prices = useStocksData(() => stocksApi.latestPrices());

  if (verdicts.error) {
    return (
      <div className="rounded-[10px] bg-white p-6 text-center text-sm text-dark-6 shadow-1 dark:bg-gray-dark">
        No council verdicts yet — run the council to get its first read on the
        market.
      </div>
    );
  }
  if (!verdicts.data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:gap-6">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="h-44 animate-pulse rounded-[10px] bg-white shadow-1 dark:bg-gray-dark"
          />
        ))}
      </div>
    );
  }

  const priceMap = new Map<string, LatestPrice>(
    (prices.data ?? []).map((p) => [p.ticker, p]),
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-body-2xlg font-bold text-dark dark:text-white">
          Latest Council Verdicts
        </h2>
        <Link
          href={`/runs/${verdicts.data.run_id}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          {verdicts.data.kind} run · {verdicts.data.as_of} · view deliberation →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:gap-6">
        {verdicts.data.verdicts.map((v) => (
          <VerdictCard key={v.ticker} verdict={v} price={priceMap.get(v.ticker)} />
        ))}
        <CashCard cash={verdicts.data.portfolio_target?.cash ?? null} />
      </div>
    </div>
  );
}

function VerdictCard({
  verdict,
  price,
}: {
  verdict: StockVerdict;
  price?: LatestPrice;
}) {
  return (
    <div className="rounded-[10px] bg-white p-5 shadow-1 dark:bg-gray-dark">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-heading-6 font-bold text-dark dark:text-white">
            {verdict.ticker}
          </div>
          {price && (
            <div className="mt-0.5 text-sm text-dark-6">
              ${price.close.toFixed(2)}{" "}
              <span className={price.change_pct < 0 ? "text-red" : "text-green"}>
                {price.change_pct >= 0 ? "+" : ""}
                {price.change_pct.toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        <span
          className={cn(
            "rounded-full px-3 py-1 text-sm font-bold",
            STANCE_STYLES[verdict.stance],
          )}
        >
          {verdict.stance}
        </span>
      </div>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-dark-6">Conviction</dt>
          <dd className="flex items-center gap-2 font-medium text-dark dark:text-white">
            <span className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-3 dark:bg-dark-3">
              <span
                className="block h-full rounded-full bg-primary"
                style={{ width: `${verdict.conviction * 10}%` }}
              />
            </span>
            {verdict.conviction}/10
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-dark-6">Target weight</dt>
          <dd
            className={cn(
              "font-bold",
              verdict.target_weight > 0 && "text-green",
              verdict.target_weight < 0 && "text-red",
            )}
          >
            {verdict.target_weight >= 0 ? "+" : ""}
            {(verdict.target_weight * 100).toFixed(1)}%
          </dd>
        </div>
      </dl>

      {verdict.rationale && (
        <details className="mt-3 text-sm text-dark-6">
          <summary className="cursor-pointer font-medium text-primary">
            Rationale
          </summary>
          <p className="mt-1.5">{verdict.rationale}</p>
        </details>
      )}
    </div>
  );
}

function CashCard({ cash }: { cash: number | null }) {
  return (
    <div className="flex flex-col justify-center rounded-[10px] border-2 border-dashed border-stroke bg-white p-5 text-center dark:border-dark-3 dark:bg-gray-dark">
      <div className="text-heading-6 font-bold text-dark dark:text-white">
        {cash != null ? `${(cash * 100).toFixed(1)}%` : "—"}
      </div>
      <div className="text-sm text-dark-6">held in cash</div>
    </div>
  );
}
