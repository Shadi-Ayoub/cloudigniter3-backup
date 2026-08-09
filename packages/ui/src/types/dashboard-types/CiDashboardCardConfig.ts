import type { CiDashboardIcon } from "./CiDashboardIcon";

/**
 * Consumer-facing dashboard card configuration.
 *
 * This lives in the Next package because it is React/UI aware.
 */
export type CiDashboardCardConfig = {
  /**
   * Stable identifier for the card.
   */
  id: string;

  /**
   * Internal or external link target.
   */
  route: string;

  /**
   * Translation key or plain label.
   */
  label: string;

  /** Short supporting copy that explains the destination. */
  description?: string;

  /** Optional compact value shown below the description. */
  meta?: string;

  /** Optional status label shown in the card header. */
  badge?: string;

  /** Semantic visual treatment for the icon surface. */
  tone?: "default" | "security" | "success" | "warning";

  /**
   * Optional icon supplied by the consumer.
   */
  icon?: CiDashboardIcon;

  /**
   * Optional class name for the outer card.
   */
  className?: string;

  /**
   * Optional class name for the content container.
   */
  contentClassName?: string;

  /**
   * Optional class name for the icon wrapper.
   */
  iconClassName?: string;

  /**
   * Optional class name for the label element.
   */
  labelClassName?: string;

  /**
   * Whether navigation should call router.refresh() after push.
   */
  refresh?: boolean;

  /**
   * Whether the clicked link should lose focus after click.
   */
  removeFocus?: boolean;

  /**
   * External link target behavior.
   */
  externalTarget?: "_blank" | "_self";
};
