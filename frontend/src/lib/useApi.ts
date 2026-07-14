"use client";

import { useCallback, useEffect, useState } from "react";
import { humanizeError, errorKind, type ErrorKind } from "./api";

export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [kind, setKind] = useState<ErrorKind | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError("");
    setKind(null);
    try {
      const res = await fetcher();
      setData(res);
    } catch (err) {
      setError(humanizeError(err));
      setKind(errorKind(err));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  return { data, loading, error, kind, reload: run };
}

/** Normalizes a DRF list response that may be paginated or a bare array. */
export function asList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && "results" in (data as any)) {
    return ((data as any).results as T[]) ?? [];
  }
  return [];
}
