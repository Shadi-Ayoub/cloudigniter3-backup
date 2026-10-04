import Link from "@docusaurus/Link";
import Heading from "@theme/Heading";
import { ArrowRight, BookOpen, Code2, Layers, Terminal } from "lucide-react";
import type { ReactElement } from "react";
import styles from "./styles.module.css";

const guides = [
  {
    title: "User guide",
    audience: "Build an application",
    description:
      "Set up your application, learn the core concepts, and build your first feature with CloudIgniter.",
    to: "/docs/intro",
    icon: BookOpen,
  },
  {
    title: "Developer guide",
    audience: "Understand the platform",
    description:
      "Explore package architecture, ownership boundaries, and workflows for extending CloudIgniter itself.",
    to: "/company-developers/architecture/core-custom-ownership",
    icon: Layers,
  },
  {
    title: "API Reference",
    audience: "Find the details",
    description:
      "Look up public APIs, components, configuration contracts, and examples as you work.",
    to: "/docs/api-reference/overview",
    icon: Code2,
  },
  {
    title: "CloudIgniter Commands",
    audience: "Work from the terminal",
    description: "Browse ci and dev commands with syntax, parameters, examples, and operational guidance.",
    to: "/commands",
    icon: Terminal,
  },
];

export default function HomepageFeatures(): ReactElement {
  return (
    <section className={styles.guides} aria-label="Explore the documentation">
      {guides.map(({ title, audience, description, to, icon: Icon }) => (
        <Link className={styles.guide} to={to} key={to}>
          <Icon
            size={22}
            strokeWidth={1.6}
            className={styles.icon}
            aria-hidden="true"
          />
          <p className={styles.audience}>{audience}</p>
          <Heading as="h2">{title}</Heading>
          <p className={styles.description}>{description}</p>
          <span className={styles.link}>
            Explore <ArrowRight size={16} aria-hidden="true" />
          </span>
        </Link>
      ))}
    </section>
  );
}
