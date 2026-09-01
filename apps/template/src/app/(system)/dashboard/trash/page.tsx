import { CiPage } from "@cloudigniter/next/client";
import {
  ciCreateAuthorizer,
  ciGlobalAccessScope,
  ciIsAdministratorRole,
  ciSystemAccessScope,
} from "@cloudigniter/core/lib";
import { CiTenantManagementPage } from "@cloudigniter/ui/client";
import { CiUserManagementPage } from "@cloudigniter/ui/client";
import {
  appBootstrap,
  appCanManageSystemSuperAdministrators,
  appCreateSecurityAdministration,
  appCreateUserManagementAuthorizationSubject,
  appIsUserAssignmentActive,
  appListUserRecords,
  appResolveAdministratorActor,
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
  const security = appCreateSecurityAdministration(context);
  const [assignments, definition] = await Promise.all([
    security.loadAssignments(),
    security.loadDefinition(),
  ]);
  const subject = appCreateUserManagementAuthorizationSubject(
    context,
    assignments,
  );
  const authorizer = ciCreateAuthorizer(definition);
  const canRestoreUsers = [ciSystemAccessScope(), ciGlobalAccessScope()].some(
    (scope) =>
      authorizer.can({
        subject,
        resource: "identity.users",
        action: "restore",
        scope,
      }),
  );
  const canPurgeUsers = [ciSystemAccessScope(), ciGlobalAccessScope()].some(
    (scope) =>
      authorizer.can({
        subject,
        resource: "identity.users",
        action: "purge",
        scope,
      }),
  );
  const canManageSystemSuperAdmins = appCanManageSystemSuperAdministrators(
    context,
    assignments,
  );
  if (!canRestore && !canRestoreUsers && !canManageSystemSuperAdmins) {
    throw new Error("You do not have permission to view Trash.");
  }
  const result = canRestore
    ? await appListTenantRecords({ deletionState: "deleted", limit: 100 })
    : null;
  const userRecords = await appListUserRecords(assignments, "deleted");
  const effectiveRoleIds = (user: (typeof userRecords)[number]) => [
    ...user.roles,
    ...user.assignments
      .filter((assignment) => appIsUserAssignmentActive(assignment))
      .map((assignment) => assignment.roleId),
  ];
  const isAdministrator = (user: (typeof userRecords)[number]) =>
    user.isRootUser === true ||
    effectiveRoleIds(user).some(ciIsAdministratorRole);
  const users = canRestoreUsers
    ? userRecords.filter((user) => !isAdministrator(user))
    : [];
  const allAdministrators = userRecords.filter(isAdministrator);
  const administrators = canRestoreUsers
    ? allAdministrators
    : allAdministrators.filter(
        (user) =>
          !user.isRootUser &&
          effectiveRoleIds(user).includes("system-super-admin"),
      );
  const administratorActor = appResolveAdministratorActor(context, assignments);

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
        {result ? (
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
        ) : null}
        {canRestoreUsers ? (
          <CiUserManagementPage
            mode="trash"
            users={users}
            providerLabel="Amazon Cognito"
            roleOptions={definition.roles.map((role) => ({
              id: role.id,
              label: role.title,
            }))}
            localeOptions={[]}
            timeZoneOptions={[]}
            locale={context.config.appResolvedCoreConfig.locale}
            actor={{
              userId: context.auth.user.id ?? "anonymous",
              roles: [...administratorActor.effectiveRoleIds],
              isRootUser: administratorActor.isRootUser,
              canManageSystemSuperAdmins,
            }}
            capabilities={{
              canCreate: false,
              canUpdate: false,
              canDelete: false,
              canAssignRoles: false,
              canEmail: false,
              canImpersonate: false,
            }}
            onRestore={restoreUserAction}
            onPurge={canPurgeUsers ? purgeUserAction : undefined}
          />
        ) : null}
        <CiUserManagementPage
          mode="trash"
          managementKind="administrators"
          users={administrators}
          providerLabel="Amazon Cognito"
          roleOptions={definition.roles
            .filter((role) => ciIsAdministratorRole(role.id))
            .map((role) => ({
              id: role.id,
              label: role.title,
            }))}
          filterRoleOptions={definition.roles
            .filter((role) => ciIsAdministratorRole(role.id))
            .map((role) => ({
              id: role.id,
              label: role.title,
            }))}
          localeOptions={[]}
          timeZoneOptions={[]}
          locale={context.config.appResolvedCoreConfig.locale}
          actor={{
            userId: context.auth.user.id ?? "anonymous",
            roles: [...administratorActor.effectiveRoleIds],
            isRootUser: administratorActor.isRootUser,
            canManageSystemSuperAdmins,
          }}
          capabilities={{
            canCreate: false,
            canUpdate: false,
            canDelete: false,
            canAssignRoles: false,
            canEmail: false,
            canImpersonate: false,
          }}
          onRestore={
            canRestoreUsers || canManageSystemSuperAdmins
              ? restoreUserAction
              : undefined
          }
          onPurge={
            canPurgeUsers || canManageSystemSuperAdmins
              ? purgeUserAction
              : undefined
          }
        />
      </div>
    </CiPage>
  );
}
