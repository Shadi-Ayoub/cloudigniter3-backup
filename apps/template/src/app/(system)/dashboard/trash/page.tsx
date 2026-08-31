import { CiPage } from "@cloudigniter/next/client";
import { CiTenantManagementPage } from "@cloudigniter/ui/client";
import { CiUserManagementPage } from "@cloudigniter/ui/client";
import {
  appBootstrap,
  appCreateSecurityAdministration,
  appListUserRecords,
} from "@/kernel/server";
import { appListTenantRecords } from "@/kernel/server/api/system/tenant/app-tenant-lifecycle-service";
import { dashboardBreadcrumbChildren } from "../breadcrumb-menu";
import { purgeTenantAction, restoreTenantAction } from "../tenants/actions";
import { purgeUserAction, restoreUserAction } from "../users/actions";

/** Lists deleted tenants and exposes restore or protected permanent deletion. */
export default async function TrashPage() {
  const context = await appBootstrap();
  const roles = context.auth.user.roles;
  const canRestore =
    roles.includes("system-admin") || roles.includes("system-super-admin");
  const canPurge = canRestore;
  if (!canRestore) throw new Error("You do not have permission to view Trash.");
  const security = appCreateSecurityAdministration(context);
  const [result, assignments] = await Promise.all([
    appListTenantRecords({ deletionState: "deleted", limit: 100 }),
    security.loadAssignments(),
  ]);
  const users = await appListUserRecords(assignments, "deleted");

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
      <div className="grid w-full gap-8">
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
        <CiUserManagementPage
          mode="trash"
          users={users}
          providerLabel="Amazon Cognito"
          roleOptions={[]}
          localeOptions={[]}
          timeZoneOptions={[]}
          capabilities={{
            canCreate: false,
            canUpdate: false,
            canDelete: false,
            canAssignRoles: false,
            canEmail: false,
            canImpersonate: false,
          }}
          onRestore={restoreUserAction}
          onPurge={purgeUserAction}
        />
      </div>
    </CiPage>
  );
}
