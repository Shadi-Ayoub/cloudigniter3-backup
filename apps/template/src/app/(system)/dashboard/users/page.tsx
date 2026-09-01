import {
  ciCreateAuthorizer,
  ciCanAccessDeveloperTools,
  ciGlobalAccessScope,
  ciIsAdministratorRole,
  ciSystemAccessScope,
} from "@cloudigniter/core/lib";
import { CiPage } from "@cloudigniter/next/client";
import { CiUserManagementPage } from "@cloudigniter/ui/client";
import {
  appBootstrap,
  appCreateSecurityAdministration,
  appCreateUserManagementAuthorizationSubject,
  appIsUserAssignmentActive,
  appListUserRecords,
  appResolveAdministratorActor,
} from "@/kernel/server";
import { dashboardBreadcrumbChildren } from "../breadcrumb-menu";
import {
  createUserAction,
  deleteUserAction,
  readUserAction,
  cleanupTestUsersAction,
  seedTestUsersAction,
  setUserStatusAction,
  updateUserAction,
} from "./actions";
import { testUsersSeeder } from "@/custom/dev/seeder";

export default async function UsersPage() {
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
  const can = (action: string) => {
    return [ciSystemAccessScope(), ciGlobalAccessScope()].some((scope) =>
      authorizer.can({
        subject,
        resource: "identity.users",
        action,
        scope,
      }),
    );
  };
  if (!can("read")) throw new Error("You cannot view User administration.");
  const users = (await appListUserRecords(assignments)).filter(
    (user) =>
      !user.isRootUser &&
      ![
        ...user.roles,
        ...user.assignments
          .filter((item) => appIsUserAssignmentActive(item))
          .map((item) => item.roleId),
      ].some((role) => ciIsAdministratorRole(role)),
  );
  const canAssignRoles = can("assign-role");
  const administratorActor = appResolveAdministratorActor(context, assignments);
  const developerToolsAccess = ciCanAccessDeveloperTools({
    envMode: context.env.mode,
    actor: {
      authenticated: context.auth.user.authenticated,
      roles: context.auth.user.roles,
    },
  });
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
      name="users"
      setup={{
        showPageHeader: false,
        withBreadcrumbChildrenMenu: true,
        breadcrumbs: [
          {
            label: "Dashboard",
            href: "/dashboard",
            children: dashboardBreadcrumbChildren,
          },
          { label: "Users" },
        ],
      }}
      context={context}
    >
      <CiUserManagementPage
        users={users}
        providerLabel="Amazon Cognito"
        roleOptions={definition.roles
          .filter((role) => !ciIsAdministratorRole(role.id))
          .map((role) => ({ id: role.id, label: role.title }))
          .sort((a, b) => a.label.localeCompare(b.label))}
        assignmentRoleOptions={definition.roles
          .filter((role) => !ciIsAdministratorRole(role.id))
          .map((role) => ({ id: role.id, label: role.title }))
          .sort((a, b) => a.label.localeCompare(b.label))}
        localeOptions={localeOptions}
        timeZoneOptions={timeZoneOptions}
        locale={context.config.appResolvedCoreConfig.locale}
        actor={{
          userId: context.auth.user.id ?? "anonymous",
          roles: [...administratorActor.effectiveRoleIds],
          isRootUser: administratorActor.isRootUser,
          canManageSystemSuperAdmins: false,
        }}
        capabilities={{
          canCreate: can("create") && canAssignRoles,
          canUpdate: can("update"),
          canDelete: can("delete"),
          canAssignRoles,
          canDelegateSystemSuperAdminManagement: false,
          canEmail: can("email") || can("update"),
          canImpersonate: can("impersonate"),
        }}
        onCreate={createUserAction}
        onUpdate={updateUserAction}
        onRead={readUserAction}
        onSetStatus={setUserStatusAction}
        onDelete={deleteUserAction}
        developmentSeeder={
          developerToolsAccess
            ? {
                id: testUsersSeeder.id,
                title: testUsersSeeder.title,
                description: testUsersSeeder.description,
                onSeed: seedTestUsersAction,
                onCleanup: cleanupTestUsersAction,
              }
            : undefined
        }
      />
    </CiPage>
  );
}
