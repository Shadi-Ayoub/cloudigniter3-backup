"use client";

import * as React from "react";
import { ListTree, RefreshCw, Trash2 } from "lucide-react";
import type { CiDevBeaconTraceTabProps } from "../../types";

type Event = {
  ts: number;
  seq: number;
  phase: string;
  name: string;
  level?: string;
  requestId?: string;
  traceId?: string;
  detail?: any;
  source?: string;
  tag?: string;
};

const safeFetchJson = async (url: string, init?: RequestInit) => {
  const res = await fetch(url, { cache: "no-store", ...init });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 160)}…`);
  }
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    if (res.status === 204) return null;
    const text = await res.text().catch(() => "");
    throw new Error(`Non-JSON response: ${text.slice(0, 160)}…`);
  }
  return res.json();
};

export function CiDevBeaconTraceTab({
  endpoint = "/ci-internal/trace",
  pollMs = 1500,
  tailBytes = 131072, // 128 KiB
  maxLines = 1500,
  autoStart = true,
}: CiDevBeaconTraceTabProps) {
  const [events, setEvents] = React.useState<Event[]>([]);
  const [auto, setAuto] = React.useState<boolean>(autoStart);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = React.useState<number | null>(null);

  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  const query = React.useMemo(() => {
    const q = new URLSearchParams();
    if (tailBytes) q.set("bytes", String(tailBytes));
    if (maxLines) q.set("lines", String(maxLines));
    const s = q.toString();
    return s ? `?${s}` : "";
  }, [tailBytes, maxLines]);

  const load = React.useCallback(async () => {
    setBusy(true);
    setErr(null);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const data = await safeFetchJson(`${endpoint}${query}`, {
        signal: ctrl.signal,
      });
      const list = (data?.events ?? []) as Event[];
      // Ensure consistent ordering by seq, with ts fallback
      list.sort((a, b) => a.seq - b.seq || a.ts - b.ts);
      setEvents(list);
      setLastUpdated(Date.now());
    } catch (e: any) {
      // Don’t crash UI — surface error but keep table usable
      setErr(e?.message ?? "Failed to load trace.");
    } finally {
      setBusy(false);
    }
  }, [endpoint, query]);

  const clear = React.useCallback(async () => {
    setBusy(true);
    setErr(null);
    abortRef.current?.abort();
    try {
      await fetch(endpoint, { method: "DELETE" });
      setEvents([]);
      setLastUpdated(Date.now());
    } catch (e: any) {
      setErr(e?.message ?? "Failed to clear trace.");
    } finally {
      setBusy(false);
    }
  }, [endpoint]);

  // Initial load
  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto polling
  React.useEffect(() => {
    if (!auto) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }
    intervalRef.current = setInterval(() => {
      void load();
    }, Math.max(500, pollMs));
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [auto, pollMs, load]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const rows = React.useMemo(() => events, [events]);

  return (
    <div className="space-y-3 p-3 text-sm">
      <div className="flex items-center gap-2">
        <ListTree className="size-4" />
        <span className="font-medium">Boot Trace</span>

        <div className="ml-auto flex items-center gap-2">
          {lastUpdated ? (
            <span className="text-muted-foreground text-xs">
              Updated {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          ) : null}

          <button
            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
            onClick={() => void load()}
            title="Refresh"
            disabled={busy}
          >
            <RefreshCw className={`size-4 ${busy ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <label className="flex cursor-pointer items-center gap-1 text-xs">
            <input
              type="checkbox"
              checked={auto}
              onChange={(e) => setAuto(e.target.checked)}
            />
            Auto
          </label>

          <button
            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-red-600"
            onClick={() => void clear()}
            title="Clear"
            disabled={busy}
          >
            <Trash2 className="size-4" />
            Clear
          </button>
        </div>
      </div>

      {err ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {err}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-xs">
          <thead className="bg-muted sticky top-0">
            <tr className="[&>th]:px-2 [&>th]:py-1 [&>th]:text-left">
              <th>#</th>
              <th>Time</th>
              <th>Src</th>
              <th>Phase</th>
              <th>Name</th>
              <th>Req</th>
              <th>Trace</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody className="[&>tr:nth-child(even)]:bg-muted/30">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="text-muted-foreground px-3 py-6 text-center"
                >
                  No trace events yet.
                </td>
              </tr>
            ) : (
              rows.map((e) => (
                <tr
                  key={e.seq}
                  className="[&>td]:px-2 [&>td]:py-1 [&>td]:align-top"
                >
                  <td className="whitespace-nowrap">{e.seq}</td>
                  <td className="whitespace-nowrap">
                    {new Date(e.ts).toLocaleTimeString()}
                  </td>
                  <td className="uppercase">{e.source?.[0] ?? "-"}</td>
                  <td className="whitespace-nowrap">{e.phase}</td>
                  <td
                    className={
                      e.level === "error" ? "font-medium text-red-600" : ""
                    }
                  >
                    {e.name}
                  </td>
                  <td className="whitespace-nowrap">
                    {e.requestId?.slice(0, 8)}
                  </td>
                  <td className="whitespace-nowrap">
                    {e.traceId?.slice(0, 8)}
                  </td>
                  <td>
                    <pre className="max-h-40 overflow-auto whitespace-pre-wrap">
                      {typeof e.detail === "string"
                        ? e.detail
                        : JSON.stringify(e.detail ?? {}, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-muted-foreground">
        Dev-only. Endpoint: <code>{endpoint}</code>
      </p>
    </div>
  );
}

/** Minimal adapter so you can append into your Dev Beacon `extraTabs`. */
export function devBeaconGetTraceTab(overrides?: CiDevBeaconTraceTabProps) {
  return {
    id: "trace",
    label: "Trace",
    icon: ListTree,
    content: <CiDevBeaconTraceTab {...overrides} />,
  };
}
