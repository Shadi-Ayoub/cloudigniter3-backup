"use client";

import { forwardRef } from "react";
import { Spin } from "antd";
import type { CiEnvMode } from "@cloudigniter/core/types";
import { CI_DEFAULT_DEV_BEACON_POSITION_CLASSES } from "@cloudigniter/core/lib";
import { cn } from "@cloudigniter/ui/client";

import type {
  CiDevBeaconButtonProps,
  CiDevBeaconSize,
} from "@cloudigniter/core/types";

const sizeMap: Record<CiDevBeaconSize, { btn: string; icon: string }> = {
  sm: { btn: "h-10 w-10", icon: "text-[18px]" },
  md: { btn: "h-12 w-12", icon: "text-[20px]" },
  lg: { btn: "h-14 w-14", icon: "text-[24px]" },
};

const envPulseClass = (env?: CiEnvMode) => {
  switch (env) {
    case "development":
      return "bg-muted-200/35 dark:bg-muted-800/35";

    case "test":
    case "staging":
      return "bg-warning/35 dark:bg-warning/40";

    default:
      return "bg-muted-200/35 dark:bg-muted-800/35";
  }
};

const CiDevBeaconButton = forwardRef<HTMLButtonElement, CiDevBeaconButtonProps>(
  (
    {
      loaded,
      onClick,
      position = "bottom-left",
      positionClasses,
      logo,
      env,
      size = "md",
      ariaLabel = "Open Developer Dashboard",
      className,
      pulse = true,
      pulseOnlyWhenLoaded = true,
      pulseClassOverride,
      ...buttonProps
    },
    ref,
  ) => {
    const posClass =
      positionClasses?.[position] ??
      CI_DEFAULT_DEV_BEACON_POSITION_CLASSES[position];
    const { btn, icon } = sizeMap[size];
    const haloColor = pulseClassOverride ?? envPulseClass(env);
    const showPulse = pulse && (!pulseOnlyWhenLoaded || loaded);

    return (
      <button
        data-ci-dev-beacon-button
        ref={ref}
        type="button"
        aria-label={ariaLabel}
        onClick={onClick}
        className={cn(
          "fixed isolate z-dev-beacon-button overflow-visible",
          "grid place-items-center text-sm font-medium",
          "cursor-pointer rounded-full shadow-xl transition-all duration-300",
          "bg-muted-200 text-muted-800 hover:bg-muted-300",
          "dark:bg-muted-800 dark:text-muted-100 dark:hover:bg-muted-700",
          "border-0 border-muted-600 dark:border-muted-700",
          "hover:scale-110 hover:shadow-2xl",
          "focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none",
          "disabled:pointer-events-none disabled:opacity-50",
          btn,
          posClass,
          className,
        )}
        {...buttonProps}
      >
        {/* HALO LAYERS (do NOT animate the button itself) */}
        {showPulse && (
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute -inset-3 -z-10 rounded-full opacity-60",
              "ci-beacon-ping", // from @layer utilities
              haloColor,
            )}
          />
        )}

        {!loaded ? (
          <Spin className={cn("block leading-none", icon)} aria-hidden />
        ) : (
          <div className="relative">
            {logo ?? (
              <div
                className={cn(icon, "rounded-full border")}
                aria-hidden
                title="CloudIgniter"
              />
            )}
          </div>
        )}
      </button>
    );
  },
);

CiDevBeaconButton.displayName = "DevBeacon Button";

export { CiDevBeaconButton };
