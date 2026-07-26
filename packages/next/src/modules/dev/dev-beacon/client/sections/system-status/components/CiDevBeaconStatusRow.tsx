export function CiDevBeaconStatusRow({
  label,
  value,
  mono = false,
  allowWrap = false,
  valueClassName,
  onClick,
  clickTitle,
}: {
  label: string;
  value: string | readonly string[];
  mono?: boolean;
  allowWrap?: boolean;
  valueClassName?: string;
  onClick?: (key: string) => void;
  clickTitle?: string;
}) {
  const isArrayValue = Array.isArray(value);
  const values: readonly string[] = isArrayValue
    ? value
    : [value ?? "Not available"];

  const valueClasses = [
    "rounded px-2 py-0.5 text-right text-xs",
    isArrayValue
      ? "bg-sky-50 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200"
      : mono
      ? "bg-muted"
      : "bg-muted/70",
    mono ? "font-mono" : "",
    allowWrap ? "break-all" : "truncate",
    onClick
      ? [
          "cursor-pointer appearance-none border-0 transition-colors",
          "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
          isArrayValue
            ? "hover:bg-sky-200 dark:hover:bg-sky-900/80"
            : "hover:bg-sky-100 hover:text-sky-800 dark:hover:bg-sky-900/50 dark:hover:text-sky-200",
        ].join(" ")
      : "",
    valueClassName ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>

      <div className="flex max-w-[65%] flex-wrap justify-end gap-1">
        {values.map((item, index) =>
          onClick ? (
            <button
              key={`${item}-${index}`}
              type="button"
              className={valueClasses}
              title={clickTitle ?? item}
              onClick={() => onClick(item)}
            >
              {item}
            </button>
          ) : (
            <span
              key={`${item}-${index}`}
              className={valueClasses}
              title={item}
            >
              {item}
            </span>
          ),
        )}
      </div>
    </div>
  );
}
