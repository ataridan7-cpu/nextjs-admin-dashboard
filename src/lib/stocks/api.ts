// Typed client for the LLM Council stock backend (FastAPI on :8001).
// All fetching is client-side: CORS for localhost:3000 is enabled on the
// backend, progress polling is inherently client-driven, and nothing here
// is secret in a locally-run app.

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8001";

export type Stance = "LONG" | "SHORT" | "FLAT";

export type StockVerdict = {
  ticker: string;
  stance: Stance;
  conviction: number;
  target_weight: number;
  rationale: string;
};

export type PortfolioTarget = {
  weights: Record<string, number>;
  cash: number;
  gross: number;
};

export type RunIndexEntry = {
  run_id: string;
  kind: "historical" | "live" | "dry_run" | "demo";
  as_of: string;
  status: "running" | "complete" | "failed";
  created_at: string;
  stance_summary: Record<string, Stance>;
};

export type CouncilRun = RunIndexEntry & {
  progress: { stage: string };
  models: {
    analysts?: string[];
    chairman?: string;
    online_search?: boolean;
  };
  tickers: string[];
  data_summary: Record<string, unknown>;
  stage1: { model: string; response: string }[];
  stage2: { model: string; ranking: string; parsed_ranking: string[] }[];
  label_to_model: Record<string, string>;
  aggregate_rankings: {
    model: string;
    average_rank: number;
    rankings_count: number;
  }[];
  stage3: { model?: string; response?: string };
  verdicts: StockVerdict[];
  portfolio_target: PortfolioTarget | null;
  error: string | null;
};

export type SeriesPoint = { x: number; y: number };

export type PortfolioPayload = {
  series: Partial<
    Record<"council" | "spy" | "equal_weight", SeriesPoint[]>
  >;
  stats: Record<string, Record<string, number | string | null>>;
  rebalances: { date: string; weights: Record<string, number> }[];
  scope: string;
  kinds_included?: string[];
};

export type LatestVerdicts = {
  run_id: string;
  kind: string;
  as_of: string;
  verdicts: StockVerdict[];
  portfolio_target: PortfolioTarget | null;
};

export type LatestPrice = {
  ticker: string;
  close: number;
  change_pct: number;
  date: string;
};

export type BacktestStatus = {
  state: "idle" | "running" | "done" | "completed_with_errors";
  completed: number;
  total: number;
  current_as_of: string | null;
};

export type StocksMeta = {
  tickers: string[];
  benchmark: string;
  analyst_models: string[];
  chairman_model: string;
  scheduler_enabled: boolean;
  run_in_progress: boolean;
};

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      detail = (await res.json()).detail ?? detail;
    } catch {
      // non-JSON error body; keep statusText
    }
    throw new ApiError(res.status, detail);
  }
  return res.json();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const stocksApi = {
  meta: () => fetchJson<StocksMeta>("/api/stocks/meta"),
  runs: () => fetchJson<RunIndexEntry[]>("/api/stocks/runs"),
  run: (id: string) => fetchJson<CouncilRun>(`/api/stocks/runs/${id}`),
  latestVerdicts: () =>
    fetchJson<LatestVerdicts>("/api/stocks/verdicts/latest"),
  latestPrices: () => fetchJson<LatestPrice[]>("/api/stocks/prices/latest"),
  portfolio: (scope: string) =>
    fetchJson<PortfolioPayload>(`/api/stocks/portfolio?scope=${scope}`),
  triggerRun: (kind: "live" | "dry_run") =>
    fetchJson<{ run_id: string; status: string }>("/api/stocks/run", {
      method: "POST",
      body: JSON.stringify({ kind }),
    }),
  triggerBacktest: () =>
    fetchJson<{ status: string }>("/api/stocks/backtest", { method: "POST" }),
  backtestStatus: () =>
    fetchJson<BacktestStatus>("/api/stocks/backtest/status"),
};

// Lightweight cross-component refresh signal: fired when a council run or
// backtest finishes so charts/cards refetch without a page reload.
export const REFRESH_EVENT = "stocks:refresh";

export function emitStocksRefresh() {
  window.dispatchEvent(new CustomEvent(REFRESH_EVENT));
}
