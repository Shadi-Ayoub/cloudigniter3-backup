"use client";

import * as React from "react";
import { Spin } from "antd";
import type { CiEnvMode } from "@cloudigniter/core/types";
import { cn } from "@ci-next/ui/client";
import { CI_DEV_BEACON_DEFAULT_POSITION_CLASSES } from "@cloudigniter/core/lib";
import type {
  CiDevBeaconButtonProps,
  // CiDevBeaconPosition,
  CiDevBeaconSize,
} from "@cloudigniter/core/types";

const sizeMap: Record<CiDevBeaconSize, { btn: string; icon: string }> = {
  // sm: { btn: 'size-8', icon: 'size-5' },
  // md: { btn: 'size-10', icon: 'size-6' },
  // lg: { btn: 'size-12', icon: 'size-7' },
  // sm: { btn: 'h-10 w-10', icon: 'size-5' },
  // md: { btn: 'h-12 w-12', icon: 'size-6' },
  // lg: { btn: 'h-14 w-14', icon: 'size-7' },
  sm: { btn: "h-10 w-10", icon: "text-[18px]" },
  md: { btn: "h-12 w-12", icon: "text-[20px]" },
  lg: { btn: "h-14 w-14", icon: "text-[24px]" },
};

const envPulseClass = (env?: CiEnvMode) => {
  let bgColor: string;

  switch (env) {
    case "development":
      bgColor = "bg-muted-500/35";
      break;
    case "test":
    case "staging":
      bgColor = "bg-amber-500/35";
      break;
    default:
      bgColor = "bg-primary/35";
  }

  return bgColor;
};

const CiDevBeaconButton = React.forwardRef<
  HTMLButtonElement,
  CiDevBeaconButtonProps
>(
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
      CI_DEV_BEACON_DEFAULT_POSITION_CLASSES[position];
    const { btn, icon } = sizeMap[size];
    const haloColor = pulseClassOverride ?? envPulseClass(env);
    const showPulse = pulse && (!pulseOnlyWhenLoaded || loaded);
    // const showPulse = true;

    return (
      <button
        ref={ref}
        type="button"
        aria-label={ariaLabel}
        onClick={onClick}
        className={cn(
          // base
          // 'fixed z-[1000] grid place-items-center rounded-full border shadow-lg',
          // theme-aware surfaces
          // 'border-success-foreground dark:border-success-foreground-dark hover:bg-success-background/60 dark:hover:bg-success-background-dark bg-success-background dark:bg-success-background-dark',
          // 'supports-[backdrop-filter]:bg-background/80 backdrop-blur',
          // positioning & stacking so halo is visible around the button
          "fixed isolate z-[2001] overflow-visible",

          // shadcn-like interactive button base
          // 'inline-flex items-center justify-center text-sm font-medium',
          "grid place-items-center text-sm font-medium",
          "cursor-pointer rounded-full shadow-xl transition-all duration-300",
          "bg-muted-200 text-muted-800 hover:bg-muted-300 hover:scale-110 hover:shadow-2xl",
          "border-muted-600 border-0",
          "focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none",
          "disabled:pointer-events-none disabled:opacity-50",
          // sizing & position
          btn,
          posClass,
          className,
        )}
        {...buttonProps}
      >
        {/* HALO LAYERS (do NOT animate the button itself) */}
        {showPulse && (
          <>
            {/* expanding ring */}
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute -inset-3 z-[2000] rounded-full opacity-60",
                "ci-beacon-ping", // from @layer utilities
                haloColor,
              )}
            />
            {/* breathing glow */}
            {/* <span
              aria-hidden
              className={cn(
                'pointer-events-none absolute -inset-3 z-0 rounded-full opacity-70 blur-md',
                'ci-beacon-pulse', // from @layer utilities
                haloColor
              )}
            /> */}
          </>
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
            {/* {logo ?? <Spin className={cn('block leading-none', icon)} aria-hidden />} */}
            {/* tiny status dot */}
            {/* <span
              className={cn(
                'ring-background absolute -right-0.5 -bottom-0.5 size-2 rounded-full ring-2',
                envDotClass(env)
              )}
            /> */}
          </div>
        )}
      </button>
    );
  },
);

CiDevBeaconButton.displayName = "DevBeacon Button";

export { CiDevBeaconButton };
