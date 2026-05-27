"use client";

import React from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiInfo,
  FiXCircle,
} from "react-icons/fi";
import { ciCapitalizeFirstLetter } from "@ci-core/lib";
import {
  Button,
  Card,
  Dialog,
  DialogHeader,
  DialogFooter,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@ci-core/client";
import { useCiFeedbackStore } from "@ci-core/client";
import type { CiFeedbackHandlerProps } from "@ci-core/client";

export const CiFeedbackHandler: React.FC<CiFeedbackHandlerProps> = ({
  direction,
  closeLabel = "Close",
}) => {
  const { getLast, isModalOpen, closeModal, isSticky } = useCiFeedbackStore();

  const feedback = getLast();
  const hasFeedback = !!feedback;

  if (!hasFeedback) return null;

  const renderIcon = () => {
    switch (feedback?.severity) {
      case "success":
        return <FiCheckCircle size={48} />;
      case "info":
        return <FiInfo size={48} />;
      case "warning":
        return <FiAlertTriangle size={48} />;
      case "error":
        return <FiXCircle size={48} />;
      case "critical":
        return <FiAlertTriangle size={48} />;
      default:
        return null;
    }
  };

  /**
   * Critical backdrop (blocking)
   * Reuses your ErrorHandler pattern and CSS class names.
   */
  if (feedback?.isCritical) {
    return (
      <div
        role="alert"
        aria-labelledby="critical-feedback-title"
        aria-describedby="critical-feedback-description"
        className="critical-backdrop"
      >
        <div
          id="critical-feedback-title"
          className="critical-backdrop-title-icon"
        >
          {renderIcon()}
          <h1 className="critical-backdrop-title-text">
            {ciCapitalizeFirstLetter(
              feedback.title ?? feedback.severity ?? "critical",
            )}
          </h1>
        </div>

        <p
          id="critical-feedback-description"
          className="critical-backdrop-message"
          dir={direction}
        >
          {feedback.message}
        </p>
      </div>
    );
  }

  return (
    <>
      {!isModalOpen && isSticky && (
        <NotificationCard
          severity={feedback.severity}
          direction={direction}
          title={feedback.title}
        />
      )}

      {isModalOpen && (
        <NotificationDialog
          title={
            feedback.title ??
            ciCapitalizeFirstLetter(feedback.severity ?? "info")
          }
          message={feedback.message || "No details available"}
          severity={feedback.severity ?? "info"}
          direction={direction}
          onClose={closeModal}
          closeLabel={closeLabel}
        />
      )}
    </>
  );
};

const NotificationCard: React.FC<{
  severity: "success" | "info" | "warning" | "error" | "critical";
  direction: "ltr" | "rtl";
  title?: string | null;
}> = ({ severity, direction, title }) => {
  const { isModalOpen, openModal } = useCiFeedbackStore();

  // Reuse your existing class naming convention; add "success" variants as needed.
  let classString = "notification-card ";

  switch (severity) {
    case "success":
      classString += "notification-card-success";
      break;
    case "info":
      classString += "notification-card-info";
      break;
    case "warning":
    case "critical":
      classString += "notification-card-warning";
      break;
    case "error":
      classString += "notification-card-error";
      break;
    default:
      classString += "notification-card-info";
  }

  const label = title ?? ciCapitalizeFirstLetter(severity);

  return (
    <Card
      role="button"
      aria-label="Open notification details"
      className={classString}
      onClick={() => {
        if (!isModalOpen) openModal();
      }}
      dir={direction}
    >
      <div className="notification-card-container">
        {severity === "success" && (
          <FiCheckCircle size={24} className="notification-card-success-icon" />
        )}
        {severity === "info" && (
          <FiInfo size={24} className="notification-card-info-icon" />
        )}
        {(severity === "warning" || severity === "critical") && (
          <FiAlertTriangle
            size={24}
            className="notification-card-warning-icon"
          />
        )}
        {severity === "error" && (
          <FiXCircle size={24} className="notification-card-error-icon" />
        )}

        <span
          role="notification-card-label"
          className="notification-card-label"
        >
          {label}!
        </span>
      </div>
    </Card>
  );
};

const NotificationDialog: React.FC<{
  title: string;
  message: string;
  severity: "success" | "info" | "warning" | "error" | "critical";
  direction: "ltr" | "rtl";
  onClose: () => void;
  closeLabel: string;
}> = ({ title, message, severity, direction, onClose, closeLabel }) => {
  // Mirrors your ErrorHandler dialog CSS convention; add success variants as needed.
  let classString = "notification-dialog-content ";
  let closeButtonClass = "";

  switch (severity) {
    case "success":
      classString += "notification-dialog-content-success";
      closeButtonClass = "dialog-close-btn-success";
      break;
    case "info":
      classString += "notification-dialog-content-info";
      closeButtonClass = "dialog-close-btn-info";
      break;
    case "warning":
    case "critical":
      classString += "notification-dialog-content-warning";
      closeButtonClass = "dialog-close-btn-warning";
      break;
    case "error":
      classString += "notification-dialog-content-error";
      closeButtonClass = "dialog-close-btn-error";
      break;
    default:
      classString += "notification-dialog-content-info";
      closeButtonClass = "dialog-close-btn-info";
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={classString} dir={direction}>
        <DialogHeader>
          <DialogTitle>
            <div className="dialog-title">
              {severity === "success" && (
                <FiCheckCircle
                  size={22}
                  className="dialog-title-icon dialog-title-icon-success"
                />
              )}
              {severity === "info" && (
                <FiInfo
                  size={22}
                  className="dialog-title-icon dialog-title-icon-info"
                />
              )}
              {(severity === "warning" || severity === "critical") && (
                <FiAlertTriangle
                  size={22}
                  className="dialog-title-icon dialog-title-icon-warning"
                />
              )}
              {severity === "error" && (
                <FiXCircle
                  size={22}
                  className="dialog-title-icon dialog-title-icon-error"
                />
              )}

              <h2 className="dialog-title-text" id="dialog-title">
                {ciCapitalizeFirstLetter(title)}
              </h2>
            </div>
          </DialogTitle>

          <DialogDescription />
        </DialogHeader>

        <p className="text-md mt-8 mb-6" id="notification-message">
          {message}
        </p>

        <DialogFooter>
          <Button
            variant="outline"
            aria-label="Close dialog"
            onClick={onClose}
            className={closeButtonClass}
          >
            {closeLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
