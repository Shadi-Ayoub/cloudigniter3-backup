import type { ReactNode } from "react";

import { CiDevBeaconTooltipBalloon } from "./CiDevBeaconTooltipBalloon";

export type CiDevBeaconCardRowValuePadding = "none" | "compact" | "default" | "comfortable";

interface CiDevBeaconCardRowProps {
  label: string;
  value: string | readonly string[];
  tooltip?: ReactNode;
  tooltipAriaLabel?: string;
  mono?: boolean;
  allowWrap?: boolean;
  valueClassName?: string;

  /**
   * Controls the padding inside each displayed value.
   *
   * @default "default"
   */
  valuePadding?: CiDevBeaconCardRowValuePadding;

  /**
   * Opens the value in a separate browser tab.
   */
  url?: string;

  onClick?: (key: string) => void;
  clickTitle?: string;
}

const valuePaddingClasses: Record<CiDevBeaconCardRowValuePadding, string> = {
  none: "p-0",
  compact: "px-1.5 py-px",
  default: "px-2 py-0.5",
  comfortable: "px-3 py-1",
};

export function CiDevBeaconCardRow({
  label,
  value,
  tooltip,
  tooltipAriaLabel,
  mono = false,
  allowWrap = false,
  valueClassName,
  valuePadding = "default",
  url,
  onClick,
  clickTitle,
}: CiDevBeaconCardRowProps) {
  const isArrayValue = Array.isArray(value);
  const values: readonly string[] = isArrayValue ? value : [value ?? "Not available"];

  const isClickable = Boolean(url || onClick);

  const valueClasses = [
    "rounded text-right text-xs",
    valuePaddingClasses[valuePadding],
    isArrayValue ? "bg-sky-50 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200" : mono ? "bg-muted" : "bg-muted/70",
    mono ? "font-mono" : "",
    allowWrap ? "break-all" : "truncate",
    isClickable
      ? [
          "cursor-pointer appearance-none border-0 transition-colors",
          "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
          isArrayValue
            ? "hover:bg-sky-200 dark:hover:bg-sky-900/80"
            : ["hover:bg-sky-100 hover:text-sky-800", "dark:hover:bg-sky-900/50 dark:hover:text-sky-200"].join(" "),
        ].join(" ")
      : "",
    url ? "no-underline" : "",
    valueClassName ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      {tooltip ? (
        <CiDevBeaconTooltipBalloon label={label} tooltip={tooltip} tooltipAriaLabel={tooltipAriaLabel} />
      ) : (
        label
      )}

      <div className="flex max-w-[65%] flex-wrap justify-end gap-1">
        {values.map((item, index) => {
          const key = `${item}-${index}`;
          const title = clickTitle ?? item;

          if (url) {
            return (
              <a key={key} href={url} target="_blank" rel="noopener noreferrer" className={valueClasses} title={title}>
                {item}
              </a>
            );
          }

          if (onClick) {
            return (
              <button key={key} type="button" className={valueClasses} title={title} onClick={() => onClick(item)}>
                {item}
              </button>
            );
          }

          return (
            <span key={key} className={valueClasses} title={item}>
              {item}
            </span>
          );
        })}
      </div>
    </div>
  );
}
