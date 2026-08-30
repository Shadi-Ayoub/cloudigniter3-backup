import { CiPage } from "@cloudigniter/next/client";
import { CiTenantManagementPage } from "@cloudigniter/ui/client";
import { ciCanAccessDeveloperTools } from "@cloudigniter/core/lib";
import { testTenantsSeeder } from "@/custom/dev/seeder";
import { appBootstrap } from "@/kernel/server";
import { appListTenantRecords } from "@/kernel/server/api/system/tenant/app-tenant-lifecycle-service";
import { dashboardBreadcrumbChildren } from "../breadcrumb-menu";
import {
  cleanupTestTenantsAction,
  deleteTenantAction,
  seedTestTenantsAction,
  setTenantStatusAction,
} from "./actions";

/** Lists non-deleted tenants and applies the default reversible delete flow. */
export default async function TenantsPage() {
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
  if (!canManage && !developerToolsAccess)
    throw new Error("You do not have permission to manage tenants.");
  const result = await appListTenantRecords({
    deletionState: "active",
    limit: 100,
  });

  return (
    <CiPage
      name="tenants"
      setup={{
        showPageHeader: false,
        withBreadcrumbChildrenMenu: true,
        breadcrumbs: [
          {
            label: "Dashboard",
            href: "/dashboard",
            children: dashboardBreadcrumbChildren,
          },
          { label: "Tenants" },
        ],
      }}
      context={context}
    >
      <CiTenantManagementPage
        mode="active"
        tenants={result.items}
        capabilities={{
          canDelete: canManage,
          canSetStatus: canManage,
          canRestore: false,
          canPurge: false,
        }}
        onDelete={deleteTenantAction}
        onSetStatus={setTenantStatusAction}
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
