"use client";

import { useState } from "react";
import type { CiDebugProbeProps } from "@cloudigniter/core/types";
import { ciUseDebugProbe } from "./CiDebugProbeProvider";

export function CiDebugProbeClient({
  id,
  title,
  data,
  enabled,
}: CiDebugProbeProps) {
  const context = ciUseDebugProbe();
  const isEnabled = enabled ?? context.enabled;

  const [open, setOpen] = useState(false);

  if (!isEnabled) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`Debug: ${id}`}
        className="ci-debug-probe-button"
      >
        🐞
      </button>

      {open && (
        <div className="ci-debug-probe-backdrop">
          <div className="ci-debug-probe-modal">
            <div className="ci-debug-probe-header">
              <strong>{title ?? id}</strong>

              <button type="button" onClick={() => setOpen(false)}>
                ×
              </button>
            </div>

            <pre className="ci-debug-probe-content">
              {JSON.stringify(data ?? {}, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </>
  );
}
