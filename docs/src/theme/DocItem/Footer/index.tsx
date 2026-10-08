import React from "react";
import { useDoc } from "@docusaurus/plugin-content-docs/client";
import OriginalFooter from "@theme-original/DocItem/Footer";
import PageDates from "../../../components/PageDates";
import DocFeedback from "../../../components/DocFeedback";
import LearningSections from "../../../components/LearningSections";

export default function DocItemFooter(): React.JSX.Element {
  const { metadata } = useDoc();
  const source = metadata.source.replace(/^@site\//, "");
  const sourceKey = source.startsWith(".generated/skills/")
    ? `.${source.slice(".generated/skills/".length)}`
    : `docs/${source}`;
  return (
    <>
      <LearningSections section="review" />
      <OriginalFooter />
      <PageDates sourceKey={sourceKey} />
      {!source.startsWith("dictionary/") &&
        !source.startsWith("developer-dictionary/") && (
          <DocFeedback title={metadata.title} />
        )}
    </>
  );
}
