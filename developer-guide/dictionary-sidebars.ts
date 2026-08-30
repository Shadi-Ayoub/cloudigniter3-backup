import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const dictionaryTermsByLetter = {
  A: [
    ["Access Control", "access-control"],
    ["Access-Control Catalog", "access-control-catalog"],
    ["Access Scope", "access-scope"],
    ["Action", "action"],
    ["Admin Role", "admin-role"],
    ["Actor", "actor"],
    ["Amplify Backend", "amplify-backend"],
    ["Amplify Sandbox", "amplify-sandbox"],
    ["Application Configuration", "application-configuration"],
    ["Application Settings", "application-settings"],
    ["Assignment", "assignment"],
    ["Authentication", "authentication"],
    ["Authorization", "authorization"],
    ["Authorizer", "authorizer"],
    ["AWS AppSync", "aws-appsync"],
    ["AWS Provider", "aws-provider"],
  ],
  B: [
    ["Backend Manifest", "backend-manifest"],
    ["Bootstrap", "bootstrap"],
    ["Bounded Context", "bounded-context"],
  ],
  C: [
    ["Canonical Org Unit", "canonical-org-unit"],
    ["CiDataTable", "cidatatable"],
    ["Client Component", "client-component"],
    ["CloudIgniter", "cloudigniter"],
    ["CloudIgniter CLI", "cloudigniter-cli"],
    ["CloudIgniter Core", "cloudigniter-core"],
    ["CloudIgniter Developers", "cloudigniter-developers"],
    ["CloudIgniter Users", "cloudigniter-users"],
    ["Cognito", "cognito"],
    ["Combining Algorithm", "combining-algorithm"],
    ["Custom Seam", "custom-seam"],
  ],
  D: [
    ["Data Entity", "data-entity"],
    ["Data Record", "data-record"],
    ["Data Store", "data-store"],
    ["Debug Probe", "debug-probe"],
    ["Deletion State", "deletion-state"],
    ["Descendants Propagation", "descendants-propagation"],
    ["Developer Role", "developer-role"],
    ["Dev Beacon", "dev-beacon"],
    ["Disposable Resource", "disposable-resource"],
    ["DynamoDB", "dynamodb"],
  ],
  E: [
    ["EmberGuard", "emberguard"],
    ["Environment Mode", "environment-mode"],
    ["Exact Propagation", "exact-propagation"],
  ],
  F: [
    ["Feature Pathname", "feature-pathname"],
    ["Framework Integration", "framework-integration"],
  ],
  G: [
    ["Generated Resource", "generated-resource"],
    ["Global Scope", "global-scope"],
    ["GSI", "gsi"],
  ],
  H: [
    ["Handler", "handler"],
    ["Hard Delete", "hard-delete"],
    ["Hierarchy-aware Authorization", "hierarchy-aware-authorization"],
    ["Hydration", "hydration"],
  ],
  I: [
    ["Identity Provider", "identity-provider"],
    ["Immutable Slug", "immutable-slug"],
    ["Internationalization", "internationalization"],
  ],
  K: [["Kernel", "kernel"]],
  L: [
    ["Lambda", "lambda"],
    ["Layout", "layout"],
    ["Locale", "locale"],
  ],
  M: [
    ["Management Page", "management-page"],
    ["Marker", "marker"],
    ["Middleware", "middleware"],
    ["Multi-tenancy", "multi-tenancy"],
  ],
  N: [
    ["NEW Badge", "new-badge"],
    ["Next.js Integration", "nextjs-integration"],
  ],
  O: [
    ["Operational Status", "operational-status"],
    ["Org Unit", "org-unit"],
    ["Org Unit Attachment", "org-unit-attachment"],
    ["Org Unit Explorer", "org-unit-explorer"],
  ],
  P: [
    ["Page Client Wrapper", "page-client-wrapper"],
    ["Page Component", "page-component"],
    ["Permission", "permission"],
    ["Precedence", "precedence"],
    ["Predecessor", "predecessor"],
    ["Privilege", "privilege"],
    ["Provider", "provider"],
    ["Proxy", "proxy"],
    ["Purge", "purge"],
  ],
  R: [
    ["Request Context", "request-context"],
    ["Resource", "resource"],
    ["Resource Domain", "resource-domain"],
    ["Resource Studio", "resource-studio"],
    ["Restore", "restore"],
    ["Role", "role"],
    ["Role Assignment", "role-assignment"],
    ["Role Inheritance", "role-inheritance"],
    ["Route", "route"],
    ["Route Definition", "route-definition"],
    ["Route Namespace", "route-namespace"],
    ["Route Page", "route-page"],
    ["Routing", "routing"],
  ],
  S: [
    ["Scope", "scope"],
    ["Scope Propagation", "scope-propagation"],
    ["Seeder", "seeder"],
    ["Server Action", "server-action"],
    ["Server Component", "server-component"],
    ["Shared Subtree", "shared-subtree"],
    ["Soft Delete", "soft-delete"],
    ["Subject", "subject"],
    ["Super Admin Role", "super-admin-role"],
    ["System Administrator", "system-administrator"],
    ["System Scope", "system-scope"],
    ["System Super Administrator", "system-super-administrator"],
    ["System Table", "system-table"],
  ],
  T: [
    ["Tenant", "tenant"],
    ["Tenant Attachment", "tenant-attachment"],
    ["Tenant Context", "tenant-context"],
    ["Tenant Scope", "tenant-scope"],
    ["Tenant-aware Route", "tenant-aware-route"],
    ["Trash", "trash"],
    ["Trusted Boundary", "trusted-boundary"],
  ],
  U: [
    ["User Role", "user-role"],
    ["User Settings", "user-settings"],
  ],
} as const;

const dictionarySidebar = [
  "index",
  ...Object.entries(dictionaryTermsByLetter)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([letter, terms]) => ({
      type: "category" as const,
      label: letter,
      link: { type: "doc" as const, id: letter.toLocaleLowerCase() },
      items: [...terms]
        .sort(([left], [right]) =>
          left.localeCompare(right, "en", {
            sensitivity: "base",
            ignorePunctuation: true,
          }),
        )
        .map(([label, anchor]) => ({
          type: "link" as const,
          label,
          href: `/dictionary/${letter.toLocaleLowerCase()}#${anchor}`,
        })),
    })),
];

const sidebars: SidebarsConfig = { dictionarySidebar };

export default sidebars;
