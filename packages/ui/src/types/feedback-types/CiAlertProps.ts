import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type CiAlertVariant =
  | "default"
  | "success"
  | "info"
  | "warning"
  | "error"
  | "critical";

/** Public configuration for an inline semantic feedback alert. */
export interface CiAlertProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children" | "title"> {
  /** Semantic presentation and announcement behavior. */
  variant?: CiAlertVariant;
  /** Optional short heading. */
  title?: ReactNode;
  /** Main alert content. May be used instead of children. */
  description?: ReactNode;
  /** Main alert content. Takes precedence over description. */
  children?: ReactNode;
  /** Whether to show the close control. Defaults to true. */
  dismissible?: boolean;
  /** Accessible name for the close control. */
  dismissLabel?: string;
  /** Called after the user activates the close control. */
  onDismiss?: () => void;
  /** Optional controlled visibility. */
  open?: boolean;
  /** Initial visibility when uncontrolled. Defaults to true. */
  defaultOpen?: boolean;
  /** Called whenever the component requests a visibility change. */
  onOpenChange?: (open: boolean) => void;
  /** Optional compact action rendered at the inline end. */
  action?: ReactNode;
  /** Custom status icon, or false to omit the icon. */
  icon?: ReactNode | false;
}
