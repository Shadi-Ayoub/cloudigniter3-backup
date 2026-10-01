import React from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import styles from "./styles.module.css";

/** Replace this handler with host integration when feedback storage is available. */
export default function DocFeedback({
  title,
}: {
  title: string;
}): React.JSX.Element {
  function vote(helpful: boolean) {
    window.alert(
      `Thanks for your feedback on “${title}”! You selected ${helpful ? "Yes" : "No"}.\n\nThis is a preview; your feedback has not been saved.`,
    );
  }

  return (
    <section className={styles.feedback} aria-label="Documentation feedback">
      <h2>Was this Doc helpful?</h2>
      <div className={styles.actions}>
        <button type="button" onClick={() => vote(true)}>
          <ThumbsUp size={16} aria-hidden="true" /> Yes
        </button>
        <button type="button" onClick={() => vote(false)}>
          <ThumbsDown size={16} aria-hidden="true" /> No
        </button>
      </div>
    </section>
  );
}
