import type { Metadata } from "next";
import { CiPage } from "@cloudigniter/next/client";
import { CiNextDashboardOverview } from "@cloudigniter/next/ui/server";
import type { CiNextDashboardCardProps } from "@cloudigniter/next/ui/client";
import { appBootstrap, appCreateSecurityAdministration } from "@/kernel/server";

export const metadata: Metadata = {
  title: "Security Center | CloudIgniter",
  description:
    "Manage CloudIgniter roles, permissions, resources, assignments, and provider mappings.",
};

/** Renders the ARBAC security center and its management destinations. */
export default async function SecurityPage() {
  const context = await appBootstrap();
  const security = appCreateSecurityAdministration(context);
  const capabilities = security.capabilities;
  if (!capabilities.canRead) {
    throw new Error("You do not have permission to view the security center.");
  }
  const [definition, assignments] = await Promise.all([
    security.loadDefinition(),
    security.loadAssignments(),
  ]);
  const records = security.buildRecords(definition, assignments);
  const mappedGroups = records["identity-group"].filter(
    (record) => record.kind === "identity-group" && record.status === "mapped"
  ).length;

  const setup: CiNextDashboardCardProps[] = [
    {
      id: "security-roles",
      icon: "ci:badge-account-outline",
      label: "Roles",
      description:
        "Define reusable responsibilities, inheritance, and precedence without duplicating policy.",
      meta: `${records.role.length} effective roles`,
      route: "/dashboard/security/roles",
      tone: "security",
    },
    {
      id: "security-permissions",
      icon: "ci:key-outline",
      label: "Permissions",
      description:
        "Review allowed and denied resource actions and their permitted scope boundaries.",
      meta: `${records.permission.length} policy statements`,
      route: "/dashboard/security/permissions",
      tone: "security",
    },
    {
      id: "security-assignments",
      icon: "ci:account-key-outline",
      label: "Assignments",
      description:
        "Grant roles to subjects at system, global, tenant, or organizational-unit scope.",
      meta: `${records.assignment.length} scoped assignments`,
      route: "/dashboard/security/assignments",
    },
    {
      id: "security-resources",
      icon: "ci:shape-outline",
      label: "Resource catalog",
      description:
        "Maintain the stable domains, resources, actions, and scope support used by policy checks.",
      meta: `${records.resource.length} protected resources`,
      route: "/dashboard/security/resources",
    },
    {
      id: "security-groups",
      icon: "ci:account-multiple-check-outline",
      label: "Identity groups",
      description:
        "Inspect provider-group mappings and detect precedence or catalog drift before it affects access.",
      meta: `${mappedGroups}/${records["identity-group"].length} AWS groups aligned`,
      badge: "AWS adapter",
      route: "/dashboard/security/identity-groups",
      tone:
        mappedGroups === records["identity-group"].length
          ? "success"
          : "warning",
    },
  ];

  return (
    <CiPage
      name="security-center"
      setup={{
        showPageHeader: false,
        breadcrumbs: [
          { label: "Dashboard", href: "/dashboard" },
          { label: "Security" },
        ],
      }}
      context={context}
    >
      <CiNextDashboardOverview
        setup={setup}
        eyebrow="Access governance"
        title="Security center"
        description="Manage the effective ARBAC policy from a single, auditable workspace. Core controls remain protected while application-owned policy can evolve safely."
        aside={
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl border border-border bg-background/80 px-4 py-3">
              <p className="text-xl font-semibold tabular-nums">
                {definition.roles.length}
              </p>
              <p className="text-xs text-muted-foreground">Roles</p>
            </div>
            <div className="rounded-xl border border-border bg-background/80 px-4 py-3">
              <p className="text-xl font-semibold tabular-nums">
                {definition.resources.length}
              </p>
              <p className="text-xs text-muted-foreground">Resources</p>
            </div>
          </div>
        }
      />
    </CiPage>
  );
}
