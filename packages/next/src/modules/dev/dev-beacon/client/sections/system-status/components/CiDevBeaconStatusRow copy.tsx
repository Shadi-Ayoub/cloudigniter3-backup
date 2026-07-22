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
  value: string;
  mono?: boolean;
  allowWrap?: boolean;
  valueClassName?: string;
  onClick?: () => void;
  clickTitle?: string;
}) {
  const valueClasses = [
    "max-w-[65%] rounded px-2 py-0.5 text-right text-xs",
    mono ? "bg-muted font-mono" : "bg-muted/70",
    allowWrap ? "break-all" : "truncate",
    onClick ? "cursor-pointer appearance-none border-0" : "",
    valueClassName ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>

      {onClick ? (
        <button
          type="button"
          className={valueClasses}
          title={clickTitle ?? value}
          onClick={onClick}
        >
          {value}
        </button>
      ) : (
        <span className={valueClasses} title={value}>
          {value}
        </span>
      )}
    </div>
  );
}
