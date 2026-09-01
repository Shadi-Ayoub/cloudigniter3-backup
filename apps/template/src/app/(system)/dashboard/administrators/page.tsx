import {
  CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE,
  ciCreateAuthorizer,
  ciGlobalAccessScope,
  ciIsAdministratorRole,
  ciResolveAdministratorAuthorityRank,
  ciSystemAccessScope,
} from "@cloudigniter/core/lib";
import { CiPage } from "@cloudigniter/next/client";
import { CiUserManagementPage } from "@cloudigniter/ui/client";
import {
  appBootstrap,
  appCanManageSystemSuperAdministrators,
  appCreateSecurityAdministration,
  appCreateUserManagementAuthorizationSubject,
  appListUserRecords,
  appIsUserAssignmentActive,
  appResolveAdministratorActor,
} from "@/kernel/server";
import { dashboardBreadcrumbChildren } from "../breadcrumb-menu";
import {
  createUserAction,
  deleteUserAction,
  readUserAction,
  setUserStatusAction,
  updateUserAction,
} from "../users/actions";

export default async function AdministratorsPage() {
  const context = await appBootstrap();
  const security = appCreateSecurityAdministration(context);
  const [definition, assignments] = await Promise.all([
    security.loadDefinition(),
    security.loadAssignments(),
  ]);
  const subject = appCreateUserManagementAuthorizationSubject(
    context,
    assignments,
  );
  const authorizer = ciCreateAuthorizer(definition);
  const canManageSystemSuperAdmins = appCanManageSystemSuperAdministrators(
    context,
    assignments,
  );
  const administratorActor = appResolveAdministratorActor(context, assignments);
  const policyCan = (action: string) =>
    [ciSystemAccessScope(), ciGlobalAccessScope()].some((scope) =>
      authorizer.can({
        subject,
        resource: "identity.users",
        action,
        scope,
      }),
    );
  const can = (action: string) =>
    policyCan(action) ||
    (canManageSystemSuperAdmins &&
      [
        "assign-role",
        "delete",
        "email",
        "purge",
        "read",
        "restore",
        "update",
      ].includes(action));
  if (!can("read")) {
    throw new Error("You cannot view Administrator administration.");
  }

  const canReadAllAdministrators = policyCan("read");
  const users = (await appListUserRecords(assignments)).filter((user) => {
    const effectiveRoleIds = [
      ...user.roles,
      ...user.assignments
        .filter((item) => appIsUserAssignmentActive(item))
        .map((item) => item.roleId),
    ];
    const isAdministrator =
      user.isRootUser || effectiveRoleIds.some(ciIsAdministratorRole);
    return (
      isAdministrator &&
      (canReadAllAdministrators ||
        (!user.isRootUser && effectiveRoleIds.includes("system-super-admin")))
    );
  });
  const actorRank = ciResolveAdministratorAuthorityRank(
    administratorActor.effectiveRoleIds,
  );
  const roleOptions = definition.roles
    .filter(
      (role) =>
        ciIsAdministratorRole(role.id) &&
        (context.auth.user.isRootUser ||
          (actorRank !== null &&
            (ciResolveAdministratorAuthorityRank([role.id]) ?? Infinity) <=
              actorRank)),
    )
    .map((role) => ({ id: role.id, label: role.title }))
    .sort((left, right) => left.label.localeCompare(right.label));
  const canAssignRoles = can("assign-role");
  const localeOptions = context.config.appCoreConfig.i18n.locales.map(
    (locale) => ({ value: locale.code, label: locale.name }),
  );
  const timeZoneOptions = Intl.supportedValuesOf("timeZone").map(
    (timeZone) => ({
      value: timeZone,
      label: timeZone.replaceAll("_", " "),
    }),
  );

  return (
    <CiPage
      name="administrators"
      setup={{
        showPageHeader: false,
        withBreadcrumbChildrenMenu: true,
        breadcrumbs: [
          {
            label: "Dashboard",
            href: "/dashboard",
            children: dashboardBreadcrumbChildren,
          },
          { label: "Administrators" },
        ],
      }}
      context={context}
    >
      <CiUserManagementPage
        managementKind="administrators"
        users={users}
        providerLabel="Amazon Cognito"
        roleOptions={roleOptions}
        filterRoleOptions={definition.roles
          .filter((role) => ciIsAdministratorRole(role.id))
          .map((role) => ({ id: role.id, label: role.title }))}
        assignmentRoleOptions={[
          ...definition.roles
            .filter(
              (role) =>
                !ciIsAdministratorRole(role.id) ||
                context.auth.user.isRootUser ||
                (actorRank !== null &&
                  (ciResolveAdministratorAuthorityRank([role.id]) ??
                    Infinity) <= actorRank),
            )
            .map((role) => ({
              id: role.id,
              label: role.title,
            })),
          ...(context.auth.user.isRootUser
            ? [
                {
                  id: CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE,
                  label: "Manage system super administrators",
                },
              ]
            : []),
        ].sort((left, right) => left.label.localeCompare(right.label))}
        localeOptions={localeOptions}
        timeZoneOptions={timeZoneOptions}
        locale={context.config.appResolvedCoreConfig.locale}
        actor={{
          userId: context.auth.user.id ?? "anonymous",
          roles: [...administratorActor.effectiveRoleIds],
          isRootUser: administratorActor.isRootUser,
          canManageSystemSuperAdmins,
        }}
        capabilities={{
          canCreate: can("create") && canAssignRoles && roleOptions.length > 0,
          canUpdate: can("update"),
          canDelete: can("delete"),
          canAssignRoles,
          canDelegateSystemSuperAdminManagement:
            context.auth.user.isRootUser === true,
          canEmail: can("email") || can("update"),
          canImpersonate: can("impersonate"),
        }}
        onCreate={createUserAction}
        onUpdate={updateUserAction}
        onRead={readUserAction}
        onSetStatus={setUserStatusAction}
        onDelete={deleteUserAction}
      />
    </CiPage>
  );
}
