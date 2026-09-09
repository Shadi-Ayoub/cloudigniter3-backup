import React from "react";
import { CalendarPlus, Clock3 } from "lucide-react";
import registry from "../../../page-dates.json";
import styles from "./styles.module.css";

const pages: Record<string, { createdAt: string; updatedAt: string }> =
  registry.pages;
function formatUtcDateTime(timestamp: string): string {
  return `${new Date(timestamp)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ")} UTC`;
}

export default function PageDates({
  sourceKey,
}: {
  sourceKey: string;
}): React.JSX.Element {
  const dates = pages[sourceKey];
  if (!dates)
    throw new Error(`Missing page dates for ${sourceKey}. Run dates:update.`);

  return (
    <footer className={styles.footer} aria-label="Page dates">
      <dl className={styles.dates}>
        <div>
          <dt className={styles.label}>
            <CalendarPlus size={16} aria-hidden="true" />
            Created
          </dt>
          <dd className={styles.value}>
            <time dateTime={dates.createdAt}>
              {formatUtcDateTime(dates.createdAt)}
            </time>
          </dd>
        </div>
        <div>
          <dt className={styles.label}>
            <Clock3 size={16} aria-hidden="true" />
            Updated
          </dt>
          <dd className={styles.value}>
            <time dateTime={dates.updatedAt}>
              {formatUtcDateTime(dates.updatedAt)}
            </time>
          </dd>
        </div>
      </dl>
    </footer>
  );
}
