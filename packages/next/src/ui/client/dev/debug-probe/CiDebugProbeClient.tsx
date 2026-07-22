"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import type { CiDebugProbeProps } from "@cloudigniter/core/types";
import { ciUseDebugProbe } from "./CiDebugProbeProvider";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@cloudigniter/ui/client";

function ciToCssPositionValue(value: number | string | undefined): string {
  if (value === undefined) return "0px";
  return typeof value === "number" ? `${value}px` : value;
}

export function CiDebugProbeClient({
  id,
  title,
  data,
  enabled,
  options,
}: CiDebugProbeProps) {
  const context = ciUseDebugProbe();

  const isEnabled = enabled ?? context.enabled;
  const isVisible = options?.visible === true;

  const [open, setOpen] = useState(false);

  if (!isEnabled || !isVisible) {
    return null;
  }

  const buttonStyle: CSSProperties = {
    left: ciToCssPositionValue(options?.x),
    top: ciToCssPositionValue(options?.y),
  };

  return (
    <span className="ci-debug-probe-anchor">
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label={`Open debug probe: ${id}`}
              className="ci-debug-probe-button"
              style={buttonStyle}
            >
              🐞
            </button>
          </TooltipTrigger>

          <TooltipContent side="top" align="center">
            <p>{id}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {open && (
        <div className="ci-debug-probe-backdrop">
          <div className="ci-debug-probe-modal">
            <div className="ci-debug-probe-header">
              <div>
                <strong>{title ?? id}</strong>
                <div className="ci-debug-probe-id">{id}</div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Close"
                aria-label="Close debug probe"
              >
                ×
              </button>
            </div>

            <pre className="ci-debug-probe-content">
              {JSON.stringify(data ?? {}, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </span>
  );
}
