import React from "react";
import Link from "@docusaurus/Link";
import { useDoc } from "@docusaurus/plugin-content-docs/client";
import styles from "./styles.module.css";

export type LearningContent = {
  prerequisites: { topic: string; href: string }[];
  questions: { question: string; answer: string }[];
};

export function useLearningContent(): LearningContent | undefined {
  const { frontMatter } = useDoc();
  // Authored frontmatter is checked for coverage, links and duplicate questions before builds.
  if (!("learning" in frontMatter)) return undefined;
  const learning = frontMatter.learning;
  return learning && typeof learning === "object"
    ? learning as LearningContent : undefined;
}

export default function LearningSections({ section }: { section: "prerequisites" | "review" }): React.JSX.Element | null {
  const learning = useLearningContent();
  const { metadata } = useDoc();
  if (!learning) return null;
  return (
    <details key={`${metadata.permalink}-${section}`} className={styles.disclosure}>
      <summary>{section === "prerequisites" ? "Prerequisite knowledge" : "Review Questions"}</summary>
      {section === "prerequisites" ? <ul>
        {learning.prerequisites.map(({ topic, href }) => <li key={href}><Link to={href}>{topic}</Link></li>)}
      </ul> : <ol>{learning.questions.map(({ question, answer }) => <li key={question}>
        <p className={styles.question}>{question}</p>
        <details className={styles.answer}>
          <summary aria-label={`See answer: ${question}`}>See answer</summary>
          <p>{answer}</p>
        </details>
      </li>)}</ol>}
    </details>
  );
}
