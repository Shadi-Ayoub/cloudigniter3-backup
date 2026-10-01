import type { CiRequestSettings } from "@ci-core/types";

/** Cookie precedence is applied by loadRequest; empty personal choices inherit public defaults. */
export function ciResolveSettingsPreferences(settings: CiRequestSettings) {
  const defaults = settings.public?.["public.preferences"] ?? {};
  const personal = settings.user?.["user.preferences"] ?? {};
  const pick = (name: string): string | undefined => {
    const value = personal[name] || defaults[name];
    return typeof value === "string" && value ? value : undefined;
  };
  return {
    locale: pick("locale"),
    theme: pick("theme"),
    timeFormat: pick("timeFormat"),
    timeZone: pick("timeZone"),
  };
}
