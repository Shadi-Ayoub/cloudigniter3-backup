import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";
import { ArrowRight, BookOpen, Braces } from "lucide-react";
import type { ReactElement } from "react";
import { useCompanyDocs } from "../utils/docs-edition";
import HomepageFeatures from "../components/HomepageFeatures";
import styles from "./index.module.css";

export default function Home(): ReactElement {
  const companyDocs = useCompanyDocs();
  return (
    <Layout
      title="Documentation"
      description="Learn to build, extend, and maintain CloudIgniter applications. Explore the user guide, developer guide, and API reference."
    >
      <main className={styles.home}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>CloudIgniter documentation</p>
          <Heading as="h1" className={styles.title}>
            Build with confidence.
            <br />
            <span>Make it your own.</span>
          </Heading>
          <p className={styles.description}>
            From your first application to the details of the platform. Guides,
            concepts, and API references for building with CloudIgniter.
          </p>
          <div className={styles.actions}>
            <Link
              className={styles.primaryAction}
              to="/docs/getting-started/before-you-start"
            >
              Get started <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              className={styles.secondaryAction}
              to="/docs/api-reference/overview"
            >
              Explore the API
            </Link>
          </div>
        </header>
        <HomepageFeatures />
        <section
          className={styles.resources}
          aria-labelledby="resources-heading"
        >
          <div>
            <Heading as="h2" id="resources-heading">
              A little more context
            </Heading>
            <p>
              Keep useful definitions and authoring workflows close at hand.
            </p>
          </div>
          <div className={styles.resourceLinks}>
            <Link to="/dictionary">
              <BookOpen size={18} aria-hidden="true" /> Dictionary{" "}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            {companyDocs && (
              <>
                <Link
                  to="/developer-dictionary"
                  className="developer-dictionary-link"
                >
                  <BookOpen size={18} aria-hidden="true" /> Developer Dictionary{" "}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link to="/skills/agents/skills/banner-design/SKILL">
                  <Braces size={18} aria-hidden="true" /> Skills{" "}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </>
            )}
          </div>
        </section>
      </main>
    </Layout>
  );
}
