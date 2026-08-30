import { CiPage } from "@cloudigniter/next/client";
import { CiOrgUnitManagementPage } from "@cloudigniter/ui/client";
import { ciCanAccessDeveloperTools } from "@cloudigniter/core/lib";
import { testTenantsSeeder } from "@/custom/dev/seeder";
import { appBootstrap } from "@/kernel/server";
import { appListOrgUnitRecords } from "@/kernel/server/api/system/org-unit/app-org-unit-management-service";
import { appListTenantRecords } from "@/kernel/server/api/system/tenant/app-tenant-lifecycle-service";
import { dashboardBreadcrumbChildren } from "../breadcrumb-menu";
import {
  cleanupTestTenantsAction,
  seedTestTenantsAction,
} from "../tenants/actions";
import { createOrgUnitAction, updateOrgUnitAction } from "./actions";

export default async function OrgUnitsPage() {
  const context = await appBootstrap();
  const roles = context.auth.user.roles;
  const canManage =
    roles.includes("system-admin") || roles.includes("system-super-admin");
  const developerToolsAccess = ciCanAccessDeveloperTools({
    envMode: context.env.mode,
    actor: {
      authenticated: context.auth.user.authenticated,
      roles,
    },
  });
  if (!canManage && !developerToolsAccess) {
    throw new Error("You do not have permission to manage Org Units.");
  }
  const [orgUnits, tenants] = await Promise.all([
    appListOrgUnitRecords({ limit: 100 }),
    appListTenantRecords({ deletionState: "active", limit: 100 }),
  ]);

  return (
    <CiPage
      name="org-units"
      setup={{
        showPageHeader: false,
        withBreadcrumbChildrenMenu: true,
        breadcrumbs: [
          {
            label: "Dashboard",
            href: "/dashboard",
            children: dashboardBreadcrumbChildren,
          },
          { label: "Org Units" },
        ],
      }}
      context={context}
    >
      <CiOrgUnitManagementPage
        orgUnits={orgUnits.items}
        tenants={tenants.items}
        canManage={canManage}
        direction={context.config.appResolvedCoreConfig.direction}
        locale={context.config.appResolvedCoreConfig.locale}
        onCreate={createOrgUnitAction}
        onUpdate={updateOrgUnitAction}
        developmentSeeder={
          developerToolsAccess
            ? {
                id: testTenantsSeeder.id,
                title: testTenantsSeeder.title,
                description: testTenantsSeeder.description,
                onSeed: seedTestTenantsAction,
                onCleanup: cleanupTestTenantsAction,
              }
            : undefined
        }
      />
    </CiPage>
  );
}
