"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import {
  ApiError,
  emitStocksRefresh,
  stocksApi,
} from "@/lib/stocks/api";

const STAGE_LABELS: Record<string, string> = {
  pending: "Preparing run…",
  stage1: "Stage 1: analysts writing memos…",
  stage2: "Stage 2: anonymous peer ranking…",
  stage3: "Stage 3: chairman synthesizing…",
  parsing: "Extracting verdicts…",
  done: "Done",
};

export function RunCouncilButton() {
  const [busy, setBusy] = useState<string | null>(null);
  const stopped = useRef(false);

  async function pollRun(runId: string) {
    for (;;) {
      if (stopped.current) return;
      await sleep(2000);
      const run = await stocksApi.run(runId);
      if (run.status === "complete") {
        toast.success(`Council run ${runId} complete`);
        emitStocksRefresh();
        return;
      }
      if (run.status === "failed") {
        toast.error(`Run failed: ${run.error ?? "unknown error"}`);
        emitStocksRefresh();
        return;
      }
      setBusy(STAGE_LABELS[run.progress?.stage] ?? "Running…");
    }
  }

  async function startRun(kind: "live" | "dry_run") {
    setBusy("Starting council run…");
    try {
      const { run_id } = await stocksApi.triggerRun(kind);
      toast.info(`Council convened (${kind}): ${run_id}`);
      await pollRun(run_id);
    } catch (e) {
      toast.error(
        e instanceof ApiError && e.status === 409
          ? "A council run is already in progress"
          : `Could not start run: ${(e as Error).message}`,
      );
    } finally {
      setBusy(null);
    }
  }

  async function startBacktest() {
    setBusy("Starting 12-month backfill…");
    try {
      await stocksApi.triggerBacktest();
      for (;;) {
        await sleep(3000);
        const s = await stocksApi.backtestStatus();
        if (s.state === "running") {
          setBusy(
            `Backfill ${s.completed}/${s.total}` +
              (s.current_as_of ? ` — council deliberating ${s.current_as_of}` : ""),
          );
          continue;
        }
        if (s.state === "completed_with_errors") {
          toast.warning("Backfill finished with some failed months");
        } else {
          toast.success(`Backfill complete (${s.completed}/${s.total})`);
        }
        emitStocksRefresh();
        return;
      }
    } catch (e) {
      toast.error(`Backtest error: ${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={() => startRun("live")}
        disabled={busy !== null}
        className="rounded-lg bg-primary px-5 py-2.5 font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Run council now
      </button>

      <button
        onClick={startBacktest}
        disabled={busy !== null}
        className="rounded-lg border border-stroke px-5 py-2.5 font-medium text-dark hover:bg-gray-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
      >
        Run 12-month backfill
      </button>

      <button
        onClick={() => startRun("dry_run")}
        disabled={busy !== null}
        className="rounded-lg border border-stroke px-5 py-2.5 text-sm font-medium text-dark-6 hover:bg-gray-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-3 dark:hover:bg-dark-2"
        title="2 cheap models × 2 tickers (~$0.01) to validate the pipeline"
      >
        Dry run
      </button>

      {busy && (
        <span className="flex items-center gap-2 text-sm font-medium text-dark-6">
          <span className="size-2 animate-pulse rounded-full bg-primary" />
          {busy}
        </span>
      )}
    </div>
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
