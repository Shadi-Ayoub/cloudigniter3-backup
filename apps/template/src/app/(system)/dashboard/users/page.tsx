import {
  ciCreateAuthorizationSubject,
  ciCreateAuthorizer,
  ciCreateRoleAssignments,
  ciCanAccessDeveloperTools,
  ciSystemAccessScope,
} from "@cloudigniter/core/lib";
import { CiPage } from "@cloudigniter/next/client";
import { CiUserManagementPage } from "@cloudigniter/ui/client";
import {
  appBootstrap,
  appCreateSecurityAdministration,
  appListUserRecords,
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
  const authorizer = ciCreateAuthorizer(definition);
  const can = (action: string) =>
    authorizer.can({
      subject,
      resource: "identity.users",
      action,
      scope: ciSystemAccessScope(),
    });
  if (!can("read")) throw new Error("You cannot view User administration.");
  const assignments = await security.loadAssignments();
  const users = await appListUserRecords(assignments);
  const canAssignRoles = can("assign-role");
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
          .filter(
            (role) =>
              role.id !== "system-super-admin" ||
              security.capabilities.canManageCore,
          )
          .map((role) => ({ id: role.id, label: role.title }))
          .sort((a, b) => a.label.localeCompare(b.label))}
        localeOptions={localeOptions}
        timeZoneOptions={timeZoneOptions}
        capabilities={{
          canCreate: can("create") && canAssignRoles,
          canUpdate: can("update"),
          canDelete: can("delete"),
          canAssignRoles,
          canEmail: can("email") || can("update"),
          canImpersonate:
            context.auth.user.roles.includes("system-super-admin"),
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
