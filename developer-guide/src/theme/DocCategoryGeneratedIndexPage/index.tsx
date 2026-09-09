import React from "react";
import { useCurrentSidebarCategory } from "@docusaurus/plugin-content-docs/client";
import OriginalCategoryPage from "@theme-original/DocCategoryGeneratedIndexPage";
import type { Props } from "@theme/DocCategoryGeneratedIndexPage";
import PageDates from "../../components/PageDates";
import styles from "./styles.module.css";

export default function DocCategoryGeneratedIndexPage(
  props: Props,
): React.JSX.Element {
  const category = useCurrentSidebarCategory();
  const sourceKey = category.customProps?.pageDatesSource;
  if (typeof sourceKey !== "string")
    throw new Error(`Missing page date source for category ${category.label}.`);
  return (
    <>
      <OriginalCategoryPage {...props} />
      <div className={styles.footerWidth}>
        <PageDates sourceKey={sourceKey} />
      </div>
    </>
  );
}
