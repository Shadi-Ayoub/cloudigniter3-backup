import { type ReactNode } from "react";

export interface CiBreadcrumbItem {
  /** If provided, used for i18n lookup (e.g., 'routes.dashboard'). */
  i18nKey?: string;
  /** Fallback/explicit label when no i18n key is provided. */
  label?: string;
  /** Link target. Omit or set on the last item to mark it as the current page. */
  href?: string;
  /** Optional small icon (e.g., <Home />) */
  icon?: ReactNode;
  /** Hide item from the UI (kept for analytics/structure if needed) */
  hidden?: boolean;
  /** Force current state even if it's not last. */
  current?: boolean;
}
