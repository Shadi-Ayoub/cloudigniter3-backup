"use client";

import { useState } from "react";
import { Info, LoaderCircle, TriangleAlert } from "lucide-react";
import type { CiAlertDialogProps, CiAlertDialogVariant } from "@ci-ui/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  cn,
} from "../components/shadcn";

/** Returns the standard media icon for a semantic confirmation variant. */
function getDefaultIcon(variant: CiAlertDialogVariant) {
  switch (variant) {
    case "warning":
    case "destructive":
      return <TriangleAlert aria-hidden />;
    default:
      return <Info aria-hidden />;
  }
}

/**
 * Accessible, acknowledgement-driven feedback built from the Shadcn Base UI
 * alert-dialog primitive.
 */
export function CiAlertDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  variant = "default",
  size = "default",
  confirmLabel = "Continue",
  cancelLabel = "Cancel",
  pendingLabel = "Working…",
  icon,
  confirmDisabled = false,
  pending = false,
  onConfirm,
  onCancel,
  onConfirmError,
  closeOnConfirm = true,
  className,
}: CiAlertDialogProps) {
  const [confirming, setConfirming] = useState(false);
  const isPending = pending || confirming;
  const isDestructive = variant === "destructive";

  const requestOpenChange = (nextOpen: boolean) => {
    if (isPending && !nextOpen) return;
    onOpenChange(nextOpen);
  };

  const confirm = async () => {
    if (isPending || confirmDisabled) return;

    setConfirming(true);
    try {
      await onConfirm();
      if (closeOnConfirm) onOpenChange(false);
    } catch (error) {
      if (onConfirmError) onConfirmError(error);
      else throw error;
    } finally {
      setConfirming(false);
    }
  };

  const cancel = () => {
    if (isPending) return;
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={requestOpenChange}>
      <AlertDialogContent
        size={size}
        aria-busy={isPending}
        data-variant={variant}
        className={cn(
          variant === "warning" && "ring-warning-border",
          isDestructive && "ring-danger-border",
          className,
        )}
      >
        <AlertDialogHeader>
          {icon === false ? null : (
            <AlertDialogMedia
              className={cn(
                variant === "warning" &&
                  "bg-warning-surface text-warning-surface-foreground",
                isDestructive &&
                  "bg-danger-surface text-danger-surface-foreground",
              )}
            >
              {icon ?? getDefaultIcon(variant)}
            </AlertDialogMedia>
          )}
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        {children ? <div className="text-sm leading-6">{children}</div> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} onClick={cancel}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant={isDestructive ? "destructive" : "default"}
            className={cn(
              isDestructive &&
                "bg-danger text-danger-foreground hover:bg-danger/90 focus-visible:border-danger-border focus-visible:ring-danger/30",
            )}
            disabled={isPending || confirmDisabled}
            onClick={() => void confirm()}
          >
            {isPending ? (
              <LoaderCircle className="animate-spin" aria-hidden />
            ) : null}
            {isPending ? pendingLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
