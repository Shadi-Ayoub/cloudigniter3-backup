"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { Spin } from "antd";
import type { CiEnvMode } from "@cloudigniter/core/types";
import { CI_DEFAULT_DEV_BEACON_POSITION_CLASSES } from "@cloudigniter/core/lib";
import { cn } from "@cloudigniter/ui/client";

import type {
  CiDevBeaconButtonProps,
  CiDevBeaconSize,
} from "@cloudigniter/core/types";
import {
  ciClampDevBeaconDragPosition,
  ciHasDevBeaconDragStarted,
  type CiDevBeaconDragPosition,
} from "./ci-dev-beacon-drag";

type CiDevBeaconPointerDrag = {
  pointerId: number;
  startX: number;
  startY: number;
  originLeft: number;
  originTop: number;
  buttonWidth: number;
  buttonHeight: number;
  active: boolean;
};

const CI_DEV_BEACON_KEYBOARD_DRAG_STEP = 8;
const CI_DEV_BEACON_KEYBOARD_DRAG_STEP_LARGE = 32;

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
      style,
      onKeyDown: onKeyDownProp,
      onLostPointerCapture: onLostPointerCaptureProp,
      onPointerCancel: onPointerCancelProp,
      onPointerDown: onPointerDownProp,
      onPointerMove: onPointerMoveProp,
      onPointerUp: onPointerUpProp,
      ...buttonProps
    },
    ref,
  ) => {
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const pointerDragRef = useRef<CiDevBeaconPointerDrag | null>(null);
    const suppressClickRef = useRef(false);
    const previousPositionRef = useRef(position);
    const [dragPosition, setDragPosition] =
      useState<CiDevBeaconDragPosition | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const posClass =
      positionClasses?.[position] ??
      CI_DEFAULT_DEV_BEACON_POSITION_CLASSES[position];
    const { btn, icon } = sizeMap[size];
    const haloColor = pulseClassOverride ?? envPulseClass(env);
    const showPulse = pulse && (!pulseOnlyWhenLoaded || loaded);

    const setButtonRef = useCallback(
      (node: HTMLButtonElement | null) => {
        buttonRef.current = node;

        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref],
    );

    const clampPosition = useCallback(
      (
        nextPosition: CiDevBeaconDragPosition,
        measuredButton?: { width: number; height: number },
      ): CiDevBeaconDragPosition => {
        const button = buttonRef.current;

        if (!button) {
          return nextPosition;
        }

        return ciClampDevBeaconDragPosition(
          nextPosition,
          measuredButton ?? {
            width: button.offsetWidth,
            height: button.offsetHeight,
          },
          { width: window.innerWidth, height: window.innerHeight },
        );
      },
      [],
    );

    useEffect(() => {
      if (previousPositionRef.current === position) {
        return;
      }

      previousPositionRef.current = position;
      pointerDragRef.current = null;
      setIsDragging(false);
      setDragPosition(null);
    }, [position]);

    useEffect(() => {
      const keepButtonInViewport = () => {
        setDragPosition((currentPosition) =>
          currentPosition ? clampPosition(currentPosition) : currentPosition,
        );
      };

      window.addEventListener("resize", keepButtonInViewport);

      return () => window.removeEventListener("resize", keepButtonInViewport);
    }, [clampPosition]);

    const finishPointerDrag = useCallback(
      (event: PointerEvent<HTMLButtonElement>, suppressClick: boolean) => {
        const session = pointerDragRef.current;

        if (!session || session.pointerId !== event.pointerId) {
          return;
        }

        if (session.active && suppressClick) {
          event.preventDefault();
          suppressClickRef.current = true;
          window.setTimeout(() => {
            suppressClickRef.current = false;
          }, 0);
        }

        pointerDragRef.current = null;
        setIsDragging(false);

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      },
      [],
    );

    const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
      onPointerDownProp?.(event);

      if (event.defaultPrevented || !event.isPrimary || event.button !== 0) {
        return;
      }

      const rect = event.currentTarget.getBoundingClientRect();

      pointerDragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originLeft: rect.left,
        originTop: rect.top,
        buttonWidth: rect.width,
        buttonHeight: rect.height,
        active: false,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
      onPointerMoveProp?.(event);

      if (event.defaultPrevented) {
        return;
      }

      const session = pointerDragRef.current;

      if (!session || session.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - session.startX;
      const deltaY = event.clientY - session.startY;

      if (!session.active) {
        if (!ciHasDevBeaconDragStarted(deltaX, deltaY)) {
          return;
        }

        session.active = true;
        setIsDragging(true);
      }

      event.preventDefault();
      setDragPosition(
        clampPosition(
          {
            left: session.originLeft + deltaX,
            top: session.originTop + deltaY,
          },
          { width: session.buttonWidth, height: session.buttonHeight },
        ),
      );
    };

    const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
      onPointerUpProp?.(event);
      finishPointerDrag(event, true);
    };

    const handlePointerCancel = (event: PointerEvent<HTMLButtonElement>) => {
      onPointerCancelProp?.(event);
      finishPointerDrag(event, false);
    };

    const handleLostPointerCapture = (
      event: PointerEvent<HTMLButtonElement>,
    ) => {
      onLostPointerCaptureProp?.(event);

      if (pointerDragRef.current?.pointerId === event.pointerId) {
        pointerDragRef.current = null;
        setIsDragging(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
      onKeyDownProp?.(event);

      if (event.defaultPrevented || !event.altKey) {
        return;
      }

      const direction = {
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        ArrowUp: { x: 0, y: -1 },
      }[event.key];

      if (!direction) {
        return;
      }

      event.preventDefault();

      const rect = event.currentTarget.getBoundingClientRect();
      const step = event.shiftKey
        ? CI_DEV_BEACON_KEYBOARD_DRAG_STEP_LARGE
        : CI_DEV_BEACON_KEYBOARD_DRAG_STEP;
      const currentPosition = dragPosition ?? {
        left: rect.left,
        top: rect.top,
      };

      setDragPosition(
        clampPosition({
          left: currentPosition.left + direction.x * step,
          top: currentPosition.top + direction.y * step,
        }),
      );
    };

    const handleClick = () => {
      if (suppressClickRef.current) {
        return;
      }

      onClick();
    };

    return (
      <button
        {...buttonProps}
        data-ci-dev-beacon-button
        data-ci-dev-beacon-dragging={isDragging ? "true" : undefined}
        ref={setButtonRef}
        type="button"
        aria-label={ariaLabel}
        aria-description="Drag to reposition. Use Alt plus an arrow key to move from the keyboard."
        aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight"
        draggable={false}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onLostPointerCapture={handleLostPointerCapture}
        onPointerCancel={handlePointerCancel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          ...style,
          touchAction: "none",
          ...(dragPosition
            ? {
                left: dragPosition.left,
                top: dragPosition.top,
                right: "auto",
                bottom: "auto",
              }
            : undefined),
        }}
        className={cn(
          "fixed isolate z-dev-beacon-button overflow-visible",
          "grid place-items-center text-sm font-medium select-none",
          "rounded-full shadow-xl transition-[background-color,box-shadow,opacity] duration-300",
          "bg-muted-200 text-muted-800 hover:bg-muted-300",
          "dark:bg-muted-800 dark:text-muted-100 dark:hover:bg-muted-700",
          "border-0 border-muted-600 dark:border-muted-700",
          isDragging
            ? "cursor-grabbing shadow-2xl"
            : "cursor-grab hover:shadow-2xl",
          "focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none",
          "disabled:pointer-events-none disabled:opacity-50",
          btn,
          dragPosition ? undefined : posClass,
          className,
        )}
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
