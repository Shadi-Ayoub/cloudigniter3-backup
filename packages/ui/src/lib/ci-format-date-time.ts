const dateTimeFormatters = new Map<string, Intl.DateTimeFormat>();

function getDateTimeFormatter(locale: string): Intl.DateTimeFormat {
  const cached = dateTimeFormatters.get(locale);
  if (cached) return cached;

  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    });
  } catch {
    formatter = new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    });
  }
  dateTimeFormatters.set(locale, formatter);
  return formatter;
}

/** Formats persisted timestamps identically during SSR and hydration. */
export function ciFormatDateTime(
  value: string | undefined,
  locale = "en-US",
): string {
  if (!value) return "—";

  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : getDateTimeFormatter(locale).format(date);
}
