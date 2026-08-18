import type { ReactNode } from "react";

export type CiAlertDialogVariant = "default" | "warning" | "destructive";
export type CiAlertDialogSize = "default" | "sm";

/** Public configuration for an acknowledgement-driven confirmation dialog. */
export interface CiAlertDialogProps {
  /** Whether the dialog is visible. */
  open: boolean;
  /** Called whenever the dialog requests a visibility change. */
  onOpenChange: (open: boolean) => void;
  /** Short question or decision heading. */
  title: ReactNode;
  /** Explanation of the action and its consequences. */
  description?: ReactNode;
  /** Optional supporting content rendered after the description. */
  children?: ReactNode;
  /** Semantic presentation for the icon and confirmation action. */
  variant?: CiAlertDialogVariant;
  /** Dialog width preset. Defaults to default. */
  size?: CiAlertDialogSize;
  /** Confirmation control label. Defaults to Continue. */
  confirmLabel?: ReactNode;
  /** Cancellation control label. Defaults to Cancel. */
  cancelLabel?: ReactNode;
  /** Confirmation label shown while an async action is pending. */
  pendingLabel?: ReactNode;
  /** Custom media icon, or false to omit the media block. */
  icon?: ReactNode | false;
  /** Disables the confirmation action. */
  confirmDisabled?: boolean;
  /** Indicates externally managed asynchronous work. */
  pending?: boolean;
  /** Runs after the user confirms. The dialog closes after successful completion. */
  onConfirm: () => void | Promise<void>;
  /** Runs when the user activates Cancel. */
  onCancel?: () => void;
  /** Receives confirmation errors. The dialog remains open. */
  onConfirmError?: (error: unknown) => void;
  /** Whether to close after confirmation succeeds. Defaults to true. */
  closeOnConfirm?: boolean;
  /** Optional class name for the dialog content surface. */
  className?: string;
}
