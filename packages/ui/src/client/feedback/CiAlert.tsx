"use client";

import { useState, type ReactNode } from "react";
import {
  CircleAlert,
  CircleCheck,
  CircleX,
  Info,
  OctagonAlert,
  TriangleAlert,
  X,
} from "lucide-react";
import type { CiAlertProps, CiAlertVariant } from "@ci-ui/types";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Button,
  cn,
} from "../components/shadcn";

const primitiveVariantByAlertVariant = {
  default: "default",
  success: "success",
  info: "info",
  warning: "warning",
  error: "destructive",
  critical: "destructive",
} as const;

/** Returns the standard icon for one semantic alert variant. */
function getDefaultIcon(variant: CiAlertVariant): ReactNode {
  switch (variant) {
    case "success":
      return <CircleCheck />;
    case "info":
      return <Info />;
    case "warning":
      return <TriangleAlert />;
    case "error":
      return <CircleX />;
    case "critical":
      return <OctagonAlert />;
    default:
      return <CircleAlert />;
  }
}

/**
 * Inline semantic feedback built from the shadcn alert primitive.
 *
 * Alerts are dismissible and uncontrolled by default. Pass
 * `dismissible={false}` for a permanent callout, or use `open` and
 * `onOpenChange` when the parent owns visibility.
 */
export function CiAlert({
  variant = "default",
  title,
  description,
  children,
  dismissible = true,
  dismissLabel = "Dismiss alert",
  onDismiss,
  open,
  defaultOpen = true,
  onOpenChange,
  action,
  icon,
  className,
  role,
  "aria-live": ariaLive,
  ...props
}: CiAlertProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = open ?? uncontrolledOpen;
  const isUrgent = variant === "error" || variant === "critical";
  const content = children ?? description;

  if (!isOpen) return null;

  const dismiss = () => {
    if (open === undefined) setUncontrolledOpen(false);
    onOpenChange?.(false);
    onDismiss?.();
  };

  return (
    <Alert
      variant={primitiveVariantByAlertVariant[variant]}
      data-severity={variant}
      role={role ?? (isUrgent ? "alert" : "status")}
      aria-live={ariaLive ?? (isUrgent ? "assertive" : "polite")}
      className={cn(
        action && dismissible && "has-data-[slot=alert-action]:pe-28",
        className
      )}
      {...props}
    >
      {icon === false ? null : icon ?? getDefaultIcon(variant)}
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      {content ? <AlertDescription>{content}</AlertDescription> : null}
      {action || dismissible ? (
        <AlertAction className="flex items-center gap-1">
          {action}
          {dismissible ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={dismissLabel}
              title={dismissLabel}
              onClick={dismiss}
              className="size-11 text-current hover:bg-current/10 hover:text-current sm:size-8"
            >
              <X aria-hidden />
            </Button>
          ) : null}
        </AlertAction>
      ) : null}
    </Alert>
  );
}
