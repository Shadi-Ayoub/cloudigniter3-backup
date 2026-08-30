import { ciFormatDateTime } from "../../lib/ci-format-date-time";

/** Formats persisted tenant timestamps identically during SSR and hydration. */
export function ciFormatTenantDate(value: string | undefined): string {
  return ciFormatDateTime(value);
}
