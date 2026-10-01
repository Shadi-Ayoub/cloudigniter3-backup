import { forbidden } from "next/navigation";
import { CiPage, CiNextNavigateWithLoader } from "@cloudigniter/next/client";
import { CiErrorPage } from "@cloudigniter/ui/client";
import { CiNextSettingsManager } from "@cloudigniter/next/ui/client";
import type {
  CiSettingsScope,
  CiSettingsManagementAction,
} from "@cloudigniter/core/types";
import {
  dashboardBreadcrumbChildren,
  settingsBreadcrumbChildren,
} from "@/app/(system)/dashboard/breadcrumb-menu";
import { appBootstrap } from "../bootstrap/app-bootstrap";
import { appSettingsAccess } from "./app-settings-access";
import {
  appSettingsBackendAvailable,
  appSettingsManager,
} from "./app-settings-manager";
import {
  appSaveSettings,
  appLoadSettings,
  appListSettingsTargets,
  appOverwriteSettings,
} from "./app-settings-actions";

export async function AppSettingsPage({
  scope,
  returnTo,
}: {
  scope: CiSettingsScope;
  returnTo?: string;
}) {
  const context = await appBootstrap();
  const user = context.auth.user;
  const access =
    scope === "user" ? undefined : await appSettingsAccess(context);
  if (access && !access.ok && access.statusCode === 403) forbidden();
  const canManage = (action: CiSettingsManagementAction) =>
    access?.ok === true && access.body[action];
  const manager = appSettingsManager(
    { id: user.id, authenticated: user.authenticated },
    canManage,
  );
  const groups = access && !access.ok ? [] : await manager.list(scope);
  const title =
    scope === "user"
      ? "My Preferences"
      : `${scope === "public" ? "Public" : "Private"} settings`;
  return (
    <CiPage
      name={`${scope}-settings`}
      context={context}
      setup={{
        showPageHeader: false,
        withBreadcrumbChildrenMenu: true,
        breadcrumbs:
          scope === "user"
            ? [{ label: title }]
            : [
                {
                  label: "Dashboard",
                  href: "/dashboard",
                  children: dashboardBreadcrumbChildren,
                },
                {
                  label: "Settings",
                  href: "/dashboard/settings",
                  children: settingsBreadcrumbChildren,
                },
                { label: title },
              ],
      }}
    >
      {access && !access.ok ? (
        <CiErrorPage
          {...access.body.errorMeta}
          message={access.body.error}
          actions={
            <CiNextNavigateWithLoader
              href={
                access.statusCode === 401
                  ? `/login?next=${encodeURIComponent(`/dashboard/settings/${scope}`)}`
                  : "/dashboard"
              }
              className="ci-error-page-retry-button min-h-11"
            >
              {access.statusCode === 401
                ? "Sign in again"
                : "Back to Dashboard"}
            </CiNextNavigateWithLoader>
          }
        />
      ) : (
        <CiNextSettingsManager
          key={`${scope}:${user.id}`}
          title={title}
          closeHref={scope === "user" ? (returnTo ?? "/dashboard") : undefined}
          description={
            scope === "user"
              ? "Preferences for your account. Only you can manage these settings."
              : scope === "public"
                ? "Application defaults available to every visitor."
                : "Application settings available to authenticated users."
          }
          groups={groups}
          canUpdate={scope === "user" || canManage("update")}
          tenancy={
            scope === "user"
              ? undefined
              : {
                  target: { scope: "system" },
                  canEnforce: canManage("enforce"),
                  canOverwrite: canManage("overwrite"),
                  onLoad: appLoadSettings.bind(null, scope),
                  onListTargets: appListSettingsTargets,
                  onOverwrite: appOverwriteSettings,
                }
          }
          saveUnavailableReason={
            appSettingsBackendAvailable
              ? undefined
              : "Saving is unavailable until the Settings backend is deployed. You can edit a draft, but it cannot be stored yet."
          }
          onSave={appSaveSettings}
        />
      )}
    </CiPage>
  );
}
