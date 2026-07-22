import { type ReactNode } from "react";

export interface CiHeaderLogoProps {
  /**
   * Destination used by the logo link.
   */
  href?: string;

  /**
   * Optional CSS class name for the anchor.
   */
  className?: string;

  /**
   * Called before an intercepted client-side navigation begins.
   */
  onNavigateStart?: (href: string) => void;

  /**
   * Performs client-side navigation.
   *
   * When omitted, the anchor retains normal browser navigation.
   */
  navigate?: (href: string) => void | Promise<void>;

  /**
   * Optionally refreshes the active route after navigation.
   */
  refreshRoute?: () => void | Promise<void>;

  /**
   * Whether the active route should be refreshed after navigation.
   */
  refresh?: boolean;

  /**
   * Called when the component mounts.
   */
  onMount?: () => void;

  /**
   * Called when the component unmounts.
   */
  onUnmount?: () => void;

  /**
   * Optional custom logo content.
   */
  children?: ReactNode;
}
