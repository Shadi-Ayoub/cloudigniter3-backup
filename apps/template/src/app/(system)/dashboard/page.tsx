import { appAccessControl } from "@/custom/auth/app-access-control";
import { appSettingsAccess } from "@/kernel/server/settings/app-settings-access";
import { appModules } from "@/kernel/server/modules/app-modules";
import { CiPage } from "@cloudigniter/next/client";
import { CiNextDashboardOverview } from "@cloudigniter/next/ui/server";
import {
  ciCreateAuthorizer,
  ciCanAccessDeveloperTools,
  ciGlobalAccessScope,
  ciSystemAccessScope,
} from "@cloudigniter/core/lib";
import {
  appBootstrap,
  appCanManageSystemSuperAdministrators,
  appCreateSecurityAdministration,
  appCreateUserManagementAuthorizationSubject,
} from "@/kernel/server";
import { dashboardBreadcrumbChildren } from "./breadcrumb-menu";
import { setup } from "./setup";

export default async function CPHomePage() {
  const context = await appBootstrap();
  const extensions = await appModules(context).enabled();
  const canManageModules = context.auth.user.roles.includes("developer") && ciCanAccessDeveloperTools({ envMode: context.env.mode, actor: { authenticated: context.auth.user.authenticated, roles: context.auth.user.roles } });
  const extensionCards = extensions.ok ? extensions.body.filter(item => item.manifest.dashboard).map(item => ({
    id: `extension-${item.manifest.id}`, icon: "ci:shape-outline" as const, label: item.manifest.dashboard!.title,
    description: item.manifest.dashboard!.description ?? item.manifest.description ?? "",
    route: `/dashboard/extensions/${item.manifest.id}`, namespace: "dashboard", meta: `Module v${item.manifest.version}`,
  })) : [];
  const settingsAccess = await appSettingsAccess(context);
  const canReadSettings = settingsAccess.ok && settingsAccess.body.read;
  const canReadSecurityCatalog = context.auth.user.roles.some(
    (role) => role === "system-admin" || role === "system-super-admin",
  );
  const security = appCreateSecurityAdministration(context);
  const [definition, assignments] = await Promise.all([
    canReadSecurityCatalog
      ? security.loadDefinition()
      : Promise.resolve(appAccessControl),
    canReadSecurityCatalog ? security.loadAssignments() : Promise.resolve([]),
  ]);
  const subject = appCreateUserManagementAuthorizationSubject(
    context,
    assignments,
  );
  const canReadSecurity = ciCreateAuthorizer(definition).can({
    subject,
    resource: "platform.authorization",
    action: "read",
    scope: ciSystemAccessScope(),
  });
  const userAuthorizer = ciCreateAuthorizer(definition);
  const canReadUsers = [ciSystemAccessScope(), ciGlobalAccessScope()].some(
    (scope) =>
      userAuthorizer.can({
        subject,
        resource: "identity.users",
        action: "read",
        scope,
      }),
  );
  const canReadAdministrators =
    canReadUsers || appCanManageSystemSuperAdministrators(context, assignments);
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
          { label: "Dashboard", children: [...dashboardBreadcrumbChildren, ...(canManageModules ? [{ label: "Modules", href: "/dashboard/modules" }] : []), ...extensionCards.map(item => ({ label: item.label, href: item.route }))] },
        ],
      }}
      context={context}
    >
      <CiNextDashboardOverview
        setup={[...setup, ...extensionCards].filter((card) => {
          if (card.id === "dashboard-modules") return canManageModules;
          if (card.id === "dashboard-settings") return canReadSettings;
          if (
            !canReadSecurityCatalog &&
            [
              "dashboard-security",
              "dashboard-users",
              "dashboard-administrators",
              "dashboard-org-units",
              "dashboard-tenants",
              "dashboard-trash",
            ].includes(card.id)
          )
            return false;
          if (card.id === "dashboard-security") return canReadSecurity;
          if (card.id === "dashboard-users") return canReadUsers;
          if (card.id === "dashboard-administrators")
            return canReadAdministrators;
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
