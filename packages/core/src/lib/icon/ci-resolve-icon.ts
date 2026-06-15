import { ciIconRegistry } from "./ci-icon-registry";

export function ciResolveIcon(
  icon: string,
  appRegistry?: Record<string, string>,
): string | null {
  if (icon.startsWith("ci:")) {
    return ciIconRegistry[icon as keyof typeof ciIconRegistry] ?? null;
  }

  if (icon.startsWith("app:")) {
    return appRegistry?.[icon] ?? null;
  }

  return null;
}
