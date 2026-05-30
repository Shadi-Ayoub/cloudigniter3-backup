/**
 * FeedbackHandler
 * - Merges the existing ErrorHandler UX into the unified feedback system.
 * - Renders:
 *   1) Critical backdrop (blocking) when feedback.isCritical is true
 *   2) Sticky notification card when modal is closed and store.isSticky is true
 *   3) Dialog modal when store.isModalOpen is true
 *
 * IMPORTANT:
 * - Mount this component ONCE in your root layout.
 */
export interface CiFeedbackHandlerProps {
  direction: "ltr" | "rtl";
  /**
   * Optional: override the close label (e.g., via next-intl in the app)
   * If omitted, defaults to "Close".
   */
  closeLabel?: string;
}
