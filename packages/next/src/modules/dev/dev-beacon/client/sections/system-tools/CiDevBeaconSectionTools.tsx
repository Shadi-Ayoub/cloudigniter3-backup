"use client";

import * as React from "react";
import { Button } from "@cloudigniter/ui/client";
import type { CiDevBeaconSectionToolsProps } from "@cloudigniter/core/types";

export function CiDevBeaconSectionTools({
  onMarkLoaded,
}: CiDevBeaconSectionToolsProps) {
  React.useEffect(() => {
    const t = setTimeout(() => onMarkLoaded(), 600); // simulate async init
    return () => clearTimeout(t);
  }, [onMarkLoaded]);

  const [label, setLabel] = React.useState<string>("");
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<null | {
    ok: boolean;
    msg: string;
  }>(null);

  async function startWave(custom?: string) {
    setBusy(true);
    setResult(null);
    try {
      const body = custom ? { label: custom } : label ? { label } : {};
      const res = await fetch("/ci-internal/trace/wave", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setResult({
        ok: true,
        msg: `Started wave${body.label ? `: ${body.label}` : ""}`,
      });
      // optional: clear input after success
      if (!custom) setLabel("");
    } catch (e: any) {
      setResult({ ok: false, msg: e?.message ?? "Failed to start wave" });
    } finally {
      setBusy(false);
    }
  }

  function tsLabel() {
    const d = new Date();
    // compact, filesystem-friendly label
    return `manual-${d.toISOString().replace(/[:.]/g, "-")}`;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Developer Tools</h3>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Seed Mock Users */}
        <div className="rounded-lg border p-3">
          <div className="mb-1 font-medium">Seed Mock Users</div>
          <p className="text-muted-foreground text-sm">
            Generate a batch of test users.
          </p>
          <div className="mt-2">
            <Button size="sm" variant="secondary">
              Open
            </Button>
          </div>
        </div>

        {/* Health Check */}
        <div className="rounded-lg border p-3">
          <div className="mb-1 font-medium">Health Check</div>
          <p className="text-muted-foreground text-sm">
            Verify Amplify config &amp; schema.
          </p>
          <div className="mt-2">
            <Button size="sm" variant="secondary">
              Run
            </Button>
          </div>
        </div>

        {/* Start Trace Wave */}
        <div className="rounded-lg border p-3 sm:col-span-2">
          <div className="mb-1 font-medium">Start New Trace Wave</div>
          <p className="text-muted-foreground text-sm">
            Inserts a separator in the trace file and Dev Beacon timeline.
            Useful before/after major actions.
          </p>

          <div className="mt-3 grid grid-cols-1 items-end gap-2 sm:grid-cols-[1fr_auto_auto]">
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder='Optional label (e.g., "before-seed-users")'
              className="focus:ring-ring/40 h-9 w-full rounded-md border px-2 text-sm outline-none focus:ring-2"
            />
            <Button
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => startWave()}
              className="sm:ml-2"
            >
              {busy ? "Starting…" : "Start Wave"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => startWave(tsLabel())}
              className="sm:ml-2"
            >
              Start w/ Timestamp
            </Button>
          </div>

          {result && (
            <div
              className={`mt-2 text-xs ${
                result.ok ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {result.msg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
