import useDocusaurusContext from "@docusaurus/useDocusaurusContext";

/** Build classification only. Authorization happens before CloudFront serves bytes. */
export function useCompanyDocs(): boolean {
  return (
    useDocusaurusContext().siteConfig.customFields?.docsEdition !== "public"
  );
}
