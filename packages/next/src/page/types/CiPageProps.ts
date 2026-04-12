import { type ReactNode } from "react";
import type { CiResolvedPageConfig } from "./CiResolvedPageConfig";
import type { CiPageSetup } from "./CiPageSetup";

/**
 * Props accepted by the CloudIgniter Page component.
 *
 * This component acts as the **client-side layout wrapper** for a route page.
 * It is typically rendered by a server route page (page.tsx) via a Page Client Wrapper.
 */
export interface CiPageProps {
  /** Full CloudIgniter page/runtime configuration (locale, direction, trace, etc.) */
  config?: CiResolvedPageConfig;

  /** Optional logical page name, mainly used for tracing and debugging */
  name?: string;

  /** Page-level setup controlling header, breadcrumbs, layout participation, etc. */
  setup?: CiPageSetup;

  /**
   * Indicates whether this page is a login/auth page.
   * Login pages intentionally suppress headers, breadcrumbs, and scrolling behavior.
   */
  login?: boolean;

  /** Page content rendered inside the layout */
  children: ReactNode;
}
