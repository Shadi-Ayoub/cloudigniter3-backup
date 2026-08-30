import { CiPage } from "@cloudigniter/next/client";
import { CiTenantManagementPage } from "@cloudigniter/ui/client";
import { appBootstrap } from "@/kernel/server";
import { appListTenantRecords } from "@/kernel/server/api/system/tenant/app-tenant-lifecycle-service";
import { dashboardBreadcrumbChildren } from "../breadcrumb-menu";
import { purgeTenantAction, restoreTenantAction } from "../tenants/actions";

/** Lists deleted tenants and exposes restore or protected permanent deletion. */
export default async function TrashPage() {
  const context = await appBootstrap();
  const roles = context.auth.user.roles;
  const canRestore =
    roles.includes("system-admin") || roles.includes("system-super-admin");
  const canPurge = canRestore;
  if (!canRestore) throw new Error("You do not have permission to view Trash.");
  const result = await appListTenantRecords({
    deletionState: "deleted",
    limit: 100,
  });

  return (
    <CiPage
      name="trash"
      setup={{
        showPageHeader: false,
        withBreadcrumbChildrenMenu: true,
        breadcrumbs: [
          {
            label: "Dashboard",
            href: "/dashboard",
            children: dashboardBreadcrumbChildren,
          },
          { label: "Trash" },
        ],
      }}
      context={context}
    >
      <CiTenantManagementPage
        mode="trash"
        tenants={result.items}
        capabilities={{
          canDelete: false,
          canSetStatus: false,
          canRestore,
          canPurge,
        }}
        onRestore={restoreTenantAction}
        onPurge={purgeTenantAction}
      />
    </CiPage>
  );
}
