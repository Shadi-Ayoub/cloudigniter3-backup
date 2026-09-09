import React from "react";
import { useDoc } from "@docusaurus/plugin-content-docs/client";
import OriginalFooter from "@theme-original/DocItem/Footer";
import PageDates from "../../../components/PageDates";

export default function DocItemFooter(): React.JSX.Element {
  const { metadata } = useDoc();
  const source = metadata.source.replace(/^@site\//, "");
  const sourceKey = source.startsWith(".generated/skills/")
    ? `.${source.slice(".generated/skills/".length)}`
    : `developer-guide/${source}`;
  return (
    <>
      <OriginalFooter />
      <PageDates sourceKey={sourceKey} />
    </>
  );
}
