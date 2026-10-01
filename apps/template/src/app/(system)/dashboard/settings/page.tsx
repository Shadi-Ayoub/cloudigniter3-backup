import { forbidden } from "next/navigation";
import { CiPage, CiNextNavigateWithLoader } from "@cloudigniter/next/client";
import { CiErrorPage } from "@cloudigniter/ui/client";
import { CiNextDashboardOverview } from "@cloudigniter/next/ui/server";
import { appBootstrap } from "@/kernel/server";
import { appSettingsAccess } from "@/kernel/server/settings/app-settings-access";
import { ciBuildSettingsRegistry } from "@/custom/settings/ci-settings-registry";
import {
  dashboardBreadcrumbChildren,
  settingsBreadcrumbChildren,
} from "../breadcrumb-menu";

export default async function SettingsPage() {
  const context = await appBootstrap();
  const access = await appSettingsAccess(context);
  if (!access.ok && access.statusCode === 403) forbidden();
  const registry = ciBuildSettingsRegistry();
  const publicGroups = Object.keys(registry.listByScope("public")).length;
  const privateGroups = Object.keys(registry.listByScope("private")).length;
  return (
    <CiPage
      name="settings"
      context={context}
      setup={{
        showPageHeader: false,
        withBreadcrumbChildrenMenu: true,
        breadcrumbs: [
          {
            label: "Dashboard",
            href: "/dashboard",
            children: dashboardBreadcrumbChildren,
          },
          { label: "Settings", children: settingsBreadcrumbChildren },
        ],
      }}
    >
      {!access.ok ? (
        <CiErrorPage
          {...access.body.errorMeta}
          message={access.body.error}
          actions={
            <CiNextNavigateWithLoader
              href={
                access.statusCode === 401
                  ? "/login?next=%2Fdashboard%2Fsettings"
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
        <CiNextDashboardOverview
          eyebrow="Application configuration"
          title="Settings"
          description="Manage application defaults and configuration from one workspace. Choose Public settings for visitor defaults or Private settings for signed-in experiences."
          aside={
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl border border-border bg-background/80 px-4 py-3">
                <p className="text-xl font-semibold tabular-nums">
                  {publicGroups}
                </p>
                <p className="text-xs text-muted-foreground">Public groups</p>
              </div>
              <div className="rounded-xl border border-border bg-background/80 px-4 py-3">
                <p className="text-xl font-semibold tabular-nums">
                  {privateGroups}
                </p>
                <p className="text-xs text-muted-foreground">Private groups</p>
              </div>
            </div>
          }
          setup={[
            {
              id: "public-settings",
              label: "Public settings",
              description:
                "Language, appearance, and defaults available to every visitor.",
              icon: "ci:earth",
              route: "/dashboard/settings/public",
              namespace: "dashboard.settings",
              meta: `${publicGroups} ${publicGroups === 1 ? "settings group" : "settings groups"}`,
              tone: "security",
            },
            {
              id: "private-settings",
              label: "Private settings",
              description:
                "Application configuration available to authenticated users.",
              icon: "ci:shield-lock-outline",
              route: "/dashboard/settings/private",
              namespace: "dashboard.settings",
              meta: `${privateGroups} ${privateGroups === 1 ? "settings group" : "settings groups"}`,
              tone: "security",
            },
          ]}
        />
      )}
    </CiPage>
  );
}
