import { CiPage } from "@cloudigniter/next/client";
import { CiNextDashboardOverview } from "@cloudigniter/next/ui/server";
import {
  ciCreateAuthorizationSubject,
  ciCreateAuthorizer,
  ciCreateRoleAssignments,
  ciSystemAccessScope,
} from "@cloudigniter/core/lib";
import { appBootstrap, appCreateSecurityAdministration } from "@/kernel/server";
import { dashboardBreadcrumbChildren } from "./breadcrumb-menu";
import { setup } from "./setup";

export default async function CPHomePage() {
  const context = await appBootstrap();
  const security = appCreateSecurityAdministration(context);
  const definition = await security.loadDefinition();
  const subject = ciCreateAuthorizationSubject(
    {
      id: context.auth.user.id ?? "anonymous",
      authenticated: context.auth.user.authenticated,
    },
    ciCreateRoleAssignments(
      context.auth.user.roles,
      ciSystemAccessScope(),
      "exact",
    ),
  );
  const canReadSecurity = ciCreateAuthorizer(definition).can({
    subject,
    resource: "platform.authorization",
    action: "read",
    scope: ciSystemAccessScope(),
  });
  const canReadTenants = ciCreateAuthorizer(definition).can({
    subject,
    resource: "platform.tenants",
    action: "read",
    scope: ciSystemAccessScope(),
  });
  const canReadOrgUnits = ciCreateAuthorizer(definition).can({
    subject,
    resource: "platform.org-units",
    action: "read",
    scope: ciSystemAccessScope(),
  });
  const roleLabel =
    context.auth.user.primaryRole?.replaceAll("-", " ") ?? "Authenticated user";

  return (
    <CiPage
      name={"dashboard-homepage"}
      setup={{
        showPageHeader: false,
        withBreadcrumbChildrenMenu: true,
        breadcrumbs: [
          { label: "Dashboard", children: dashboardBreadcrumbChildren },
        ],
      }}
      context={context}
    >
      <CiNextDashboardOverview
        setup={setup.filter((card) => {
          if (card.id === "dashboard-security") return canReadSecurity;
          if (card.id === "dashboard-org-units") return canReadOrgUnits;
          if (
            card.id === "dashboard-tenants" ||
            card.id === "dashboard-trash"
          ) {
            return canReadTenants;
          }
          return true;
        })}
        eyebrow="Administration workspace"
        title="Control center"
        description="A focused view of the people, policy, tenants, and platform services that keep your application operating securely."
        aside={
          <div className="rounded-xl border border-border bg-background/80 px-4 py-3 text-sm shadow-sm backdrop-blur">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Current access
            </p>
            <p className="mt-1 font-semibold capitalize text-foreground">
              {roleLabel.toLowerCase()}
            </p>
          </div>
        }
      />
    </CiPage>
  );
}
