"use client";

import Link from "next/link";
import { use, useState } from "react";

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
import { stocksApi, type CouncilRun } from "@/lib/stocks/api";

const TABS = [
  { id: "stage1", label: "Stage 1 · Analyst memos" },
  { id: "stage2", label: "Stage 2 · Peer rankings" },
  { id: "stage3", label: "Stage 3 · Chairman & verdicts" },
] as const;

export default function RunDetailPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = use(params);
  const [tab, setTab] = useState<string>("stage3");
  const { data: run, error } = useStocksData(
    () => stocksApi.run(runId),
    [runId],
  );

  if (error) {
    return (
      <p className="py-10 text-center text-sm text-red">
        Could not load run “{runId}”: {error}
      </p>
    );
  }
  if (!run) {
    return <p className="py-10 text-center text-sm text-dark-6">Loading…</p>;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="rounded-[10px] bg-white px-7.5 py-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-body-2xlg font-bold text-dark dark:text-white">
              Council run · {run.as_of}
            </h1>
            <p className="text-sm text-dark-6">
              {run.kind} · {run.status}
              {run.models?.online_search ? " · web search enabled" : ""} ·
              chairman: {run.models?.chairman ?? "—"}
            </p>
          </div>
          <Link
            href="/runs"
            className="text-sm font-medium text-primary hover:underline"
          >
            ← All runs
          </Link>
        </div>

        {run.error && (
          <p className="mt-3 rounded-lg bg-red/10 px-4 py-2.5 text-sm text-red">
            Run error: {run.error}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-1 rounded-lg bg-gray-2 p-1 dark:bg-dark-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium",
                tab === t.id
                  ? "bg-white text-dark shadow-1 dark:bg-gray-dark dark:text-white"
                  : "text-dark-6 hover:text-dark dark:hover:text-white",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "stage1" && <Stage1 run={run} />}
      {tab === "stage2" && <Stage2 run={run} />}
      {tab === "stage3" && <Stage3 run={run} />}
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[10px] bg-white px-7.5 py-6 shadow-1 dark:bg-gray-dark dark:shadow-card">
      <h2 className="mb-3 font-bold text-dark dark:text-white">{title}</h2>
      {children}
    </div>
  );
}

function Memo({ text }: { text: string }) {
  return (
    <pre className="max-h-150 overflow-auto rounded-lg bg-gray-1 p-4 text-sm whitespace-pre-wrap text-dark dark:bg-dark-2 dark:text-dark-6">
      {text}
    </pre>
  );
}

function Stage1({ run }: { run: CouncilRun }) {
  if (!run.stage1?.length) {
    return <Card title="Analyst memos">No memos recorded.</Card>;
  }
  return (
    <>
      {run.stage1.map((memo) => (
        <Card key={memo.model} title={memo.model}>
          <Memo text={memo.response} />
        </Card>
      ))}
    </>
  );
}

function Stage2({ run }: { run: CouncilRun }) {
  if (!run.stage2?.length) {
    return <Card title="Peer rankings">No rankings recorded.</Card>;
  }
  return (
    <>
      <Card title="Who was who (revealed after ranking)">
        <p className="mb-3 text-sm text-dark-6">
          Evaluators saw anonymized memos labeled “Response A/B/C…”. The
          mapping below was never shown to them — it is revealed here for
          transparency.
        </p>
        <ul className="grid gap-1 text-sm sm:grid-cols-2">
          {Object.entries(run.label_to_model ?? {}).map(([label, model]) => (
            <li key={label} className="text-dark dark:text-white">
              <span className="font-bold">{label}</span> ={" "}
              <span className="text-dark-6">{model}</span>
            </li>
          ))}
        </ul>

        {run.aggregate_rankings?.length > 0 && (
          <div className="mt-4">
            <h3 className="mb-1 text-sm font-bold text-dark dark:text-white">
              Aggregate peer ranking (lower = better)
            </h3>
            <ul className="text-sm text-dark-6">
              {run.aggregate_rankings.map((r, i) => (
                <li key={r.model}>
                  {i + 1}. {r.model} — avg rank {r.average_rank} (
                  {r.rankings_count} votes)
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {run.stage2.map((evaluation) => (
        <Card key={evaluation.model} title={`Evaluator: ${evaluation.model}`}>
          <Memo text={evaluation.ranking} />
          <p className="mt-2 text-sm text-dark-6">
            <span className="font-bold">Extracted ranking:</span>{" "}
            {evaluation.parsed_ranking?.length
              ? evaluation.parsed_ranking
                  .map(
                    (label) =>
                      `${label} (${run.label_to_model?.[label] ?? "?"})`,
                  )
                  .join(" → ")
              : "could not parse"}
          </p>
        </Card>
      ))}
    </>
  );
}

function Stage3({ run }: { run: CouncilRun }) {
  return (
    <>
      {run.verdicts?.length > 0 && (
        <Card title="Final verdicts (normalized)">
          <Table>
            <TableHeader>
              <TableRow className="border-none uppercase [&>th]:text-center">
                <TableHead className="!text-left">Ticker</TableHead>
                <TableHead>Stance</TableHead>
                <TableHead>Conviction</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead className="!text-left">Rationale</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {run.verdicts.map((v) => (
                <TableRow
                  key={v.ticker}
                  className="text-center text-sm font-medium text-dark dark:text-white"
                >
                  <TableCell className="!text-left font-bold">
                    {v.ticker}
                  </TableCell>
                  <TableCell
                    className={cn(
                      v.stance === "LONG" && "text-green",
                      v.stance === "SHORT" && "text-red",
                    )}
                  >
                    {v.stance}
                  </TableCell>
                  <TableCell>{v.conviction}/10</TableCell>
                  <TableCell
                    className={cn(
                      v.target_weight > 0 && "text-green",
                      v.target_weight < 0 && "text-red",
                    )}
                  >
                    {v.target_weight >= 0 ? "+" : ""}
                    {(v.target_weight * 100).toFixed(1)}%
                  </TableCell>
                  <TableCell className="!text-left text-dark-6">
                    {v.rationale}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {run.portfolio_target && (
            <p className="mt-2 text-sm text-dark-6">
              Gross exposure {(run.portfolio_target.gross * 100).toFixed(1)}% ·
              cash {(run.portfolio_target.cash * 100).toFixed(1)}%
            </p>
          )}
        </Card>
      )}

      <Card title={`Chairman synthesis (${run.stage3?.model ?? "—"})`}>
        {run.stage3?.response ? (
          <Memo text={run.stage3.response} />
        ) : (
          <p className="text-sm text-dark-6">No chairman output recorded.</p>
        )}
      </Card>
    </>
  );
}
