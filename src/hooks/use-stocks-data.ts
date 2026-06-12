"use client";

import { useCallback, useEffect, useState } from "react";

import { REFRESH_EVENT } from "@/lib/stocks/api";

/**
 * Fetch-on-mount with refetch on the global stocks refresh event and
 * whenever `deps` change. Returns null while loading; errors surface as
 * `error`.
 */
export function useStocksData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetcher()
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
    window.addEventListener(REFRESH_EVENT, load);
    return () => window.removeEventListener(REFRESH_EVENT, load);
  }, [load]);

  return { data, error, loading, reload: load };
}
