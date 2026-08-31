import type { Metadata } from "next";
import { CiPage } from "@cloudigniter/next/client";
import { CiNextDashboardOverview } from "@cloudigniter/next/ui/server";
import type { CiNextDashboardCardProps } from "@cloudigniter/next/ui/client";
import { appBootstrap, appCreateSecurityAdministration } from "@/kernel/server";
import {
  dashboardBreadcrumbChildren,
  securityBreadcrumbChildren,
} from "../breadcrumb-menu";

export const metadata: Metadata = {
  title: "Security Center | CloudIgniter",
  description:
    "Manage CloudIgniter roles, privileges, scoped assignments, and identity-provider mappings.",
};

/** Renders the ARBAC security center and its management destinations. */
export default async function SecurityPage() {
  const context = await appBootstrap();
  const securityReader = appCreateSecurityAdministration(context);
  const definition = await securityReader.loadDefinition();
  const security = appCreateSecurityAdministration(context, definition);
  const capabilities = security.capabilities;
  if (!capabilities.canRead) {
    throw new Error("You do not have permission to view the security center.");
  }
  const [assignments, roleCounters] = await Promise.all([
    security.loadAssignments(),
    security.loadRoleCounters(),
  ]);
  const records = security.buildRecords(definition, assignments, roleCounters);
  const mappedGroups = records["identity-group"].filter(
    (record) => record.kind === "identity-group" && record.status === "mapped"
  ).length;

  const setup: CiNextDashboardCardProps[] = [
    {
      id: "security-roles",
      icon: "ci:badge-account-outline",
      label: "Roles",
      description:
        "A role is a stable, named set of privileges associated with an application responsibility. Roles may inherit other roles to compose policy without duplication; when highest-precedence evaluation is enabled, lower numeric values represent stronger precedence. Example: the built-in admin role inherits user and declares allow privileges for identity.users.read and identity.users.update at global, tenant, and Org Unit scopes.",
      meta: `${records.role.length} effective roles`,
      route: "/dashboard/security/roles",
      tone: "security",
    },
    {
      id: "security-permissions",
      icon: "ci:key-outline",
      label: "Permissions",
      description:
        "A permission is a serializable privilege statement attached to a role. It combines a stable identifier, an allow or deny effect, a registered resource, an action, and the scope kinds where it may match. Example: the admin privilege read-users allows the read action on identity.users for global, tenant, and Org Unit requests; the concrete boundary is supplied by the role assignment.",
      meta: `${records.permission.length} policy statements`,
      route: "/dashboard/security/permissions",
      tone: "security",
    },
    {
      id: "security-assignments",
      icon: "ci:account-key-outline",
      label: "Assignments",
      description:
        "A role assignment binds an authenticated subject to a catalog role at a system, global, tenant, or Org Unit scope. Its propagation policy controls whether the grant is exact or extends to descendant scopes, and an optional validity window can make it time-bound. Example: assigning admin to subject user-123 at Tenant A with exact propagation enables its identity.users.read privilege only for Tenant A requests.",
      meta: `${records.assignment.length} scoped assignments`,
      route: "/dashboard/security/assignments",
    },
    {
      id: "security-groups",
      icon: "ci:account-multiple-check-outline",
      label: "Identity groups",
      description:
        "Identity-group mappings translate trusted provider group claims into roles from the resolved CloudIgniter catalog. The catalog remains authoritative for privileges and precedence, while the adapter detects missing roles and precedence drift. Example: map the Amazon Cognito group ci-admins to admin, whose catalog privileges allow identity.users.read and identity.users.update within the assignment scope established by the application.",
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
        withBreadcrumbChildrenMenu: true,
        breadcrumbs: [
          {
            label: "Dashboard",
            href: "/dashboard",
            children: dashboardBreadcrumbChildren,
          },
          { label: "Security", children: securityBreadcrumbChildren },
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
                {records.permission.length}
              </p>
              <p className="text-xs text-muted-foreground">Permissions</p>
            </div>
          </div>
        }
      />
    </CiPage>
  );
}
