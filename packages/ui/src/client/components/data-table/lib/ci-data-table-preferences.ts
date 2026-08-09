import type {
  CiDataTablePersistenceConfig,
  CiDataTablePreferences,
} from "@ci-ui/types";

const COOKIE_PREFIX = "ci-data-table";

/** Resolves the stable cookie name used by one data-table instance. */
export function ciGetDataTablePreferenceCookieName(
  config: CiDataTablePersistenceConfig
): string {
  return config.cookieName ?? `${COOKIE_PREFIX}-${config.key}`;
}

/** Reads a table's persisted browser preferences, ignoring malformed cookies. */
export function ciLoadDataTablePreferences(
  config: CiDataTablePersistenceConfig
): CiDataTablePreferences | null {
  if (typeof document === "undefined") return null;

  const name = `${encodeURIComponent(
    ciGetDataTablePreferenceCookieName(config)
  )}=`;
  const raw = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(name))
    ?.slice(name.length);

  if (!raw) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as unknown;
    return parsed && typeof parsed === "object"
      ? (parsed as CiDataTablePreferences)
      : null;
  } catch {
    return null;
  }
}

/** Stores compact data-table preferences in a SameSite browser cookie. */
export function ciSaveDataTablePreferences(
  config: CiDataTablePersistenceConfig,
  preferences: CiDataTablePreferences
): void {
  if (typeof document === "undefined") return;

  const name = encodeURIComponent(ciGetDataTablePreferenceCookieName(config));
  const value = encodeURIComponent(JSON.stringify(preferences));
  const maxAge = Math.max(1, config.maxAgeDays ?? 365) * 24 * 60 * 60;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";

  document.cookie = `${name}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

/** Removes a table's persisted browser preferences. */
export function ciClearDataTablePreferences(
  config: CiDataTablePersistenceConfig
): void {
  if (typeof document === "undefined") return;
  const name = encodeURIComponent(ciGetDataTablePreferenceCookieName(config));
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}
