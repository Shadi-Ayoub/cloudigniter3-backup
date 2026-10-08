import React from "react";
import { MDXProvider } from "@mdx-js/react";
import { useDoc } from "@docusaurus/plugin-content-docs/client";
import Heading from "@theme/Heading";
import MDXContent from "@theme/MDXContent";
import type { Props } from "@theme/DocItem/Content";
import LearningSections from "../../../components/LearningSections";

function LessonTitle(props: React.ComponentProps<"h1">): React.JSX.Element {
  return <><Heading as="h1" {...props} /><LearningSections section="prerequisites" /></>;
}

export default function DocItemContent({ children }: Props): React.JSX.Element {
  const { metadata, frontMatter, contentTitle } = useDoc();
  const syntheticTitle = !frontMatter.hide_title && contentTitle === undefined;
  return (
    <div className="theme-doc-markdown markdown">
      {syntheticTitle && <header><LessonTitle>{metadata.title}</LessonTitle></header>}
      <MDXContent><MDXProvider components={{ h1: LessonTitle }}>{children}</MDXProvider></MDXContent>
    </div>
  );
}
