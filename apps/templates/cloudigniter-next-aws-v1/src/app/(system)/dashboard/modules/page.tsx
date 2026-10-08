import { forbidden } from "next/navigation";
import { ciCanAccessDeveloperTools } from "@cloudigniter/core/lib";
import { CiPage } from "@cloudigniter/next/client";
import { CiNextModuleManagementPage } from "@cloudigniter/next/ui/client";
import { appBootstrap } from "@/kernel/server";
import { appModules } from "@/kernel/server/modules/app-modules";
import {
  appListModules,
  appModuleCommand,
} from "@/kernel/server/modules/app-module-actions";
import { dashboardBreadcrumbChildren } from "../breadcrumb-menu";

export default async function ModulesPage() {
  const context = await appBootstrap();
  if (
    !context.auth.user.roles.includes("developer") ||
    !ciCanAccessDeveloperTools({
      envMode: context.env.mode,
      actor: {
        authenticated: context.auth.user.authenticated,
        roles: context.auth.user.roles,
      },
    })
  )
    forbidden();
  const client = appModules(context);
  const result = await client.list();
  if (!result.ok && result.statusCode === 403) forbidden();
  return (
    <CiPage
      name="modules"
      context={context}
      setup={{
        showPageHeader: false,
        withBreadcrumbChildrenMenu: true,
        breadcrumbs: [
          {
            i18nKey: "dashboard.title",
            href: "/dashboard",
            children: dashboardBreadcrumbChildren,
          },
          { i18nKey: "modules.title" },
        ],
      }}
    >
      <CiNextModuleManagementPage
        initialCatalog={result.ok ? result.body : client.detected()}
        initialError={result.ok ? undefined : result.body.error}
        onReload={appListModules}
        onCommand={appModuleCommand}
      />
    </CiPage>
  );
}
