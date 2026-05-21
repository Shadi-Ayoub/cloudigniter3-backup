import type { ReactNode } from "react";

export interface CiBreadcrumbItem {
  /** If provided, used for i18n lookup, for example: "routes.dashboard". */
  i18nKey?: string;

  /** Fallback or explicit label when no i18n key is provided. */
  label?: string;

  /** Link target. Omit on the current page item. */
  href?: string;

  /** Optional small icon, for example: <Home />. */
  icon?: ReactNode;

  /** Hide item from the UI while keeping it available in the item list. */
  hidden?: boolean;

  /** Force current state even when the item is not the last item. */
  current?: boolean;
}
