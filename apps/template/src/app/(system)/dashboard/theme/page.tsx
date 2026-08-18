import type { CiPageSetup } from "@cloudigniter/core/types";
import { CiPage } from "@cloudigniter/next/client";
import { CiThemePresentationPage } from "@cloudigniter/next/ui/client";
import { appBootstrap } from "@/kernel/server";
import { dashboardBreadcrumbChildren } from "../breadcrumb-menu";

export default async function ThemePresentationPage() {
  const context = await appBootstrap();

  const pageSetup: CiPageSetup = {
    showPageHeader: false,
    showBreadcrumbs: true,
    withBreadcrumbChildrenMenu: true,
    breadcrumbs: [
      {
        i18nKey: "common.dashboard",
        href: "/dashboard",
        children: dashboardBreadcrumbChildren,
      },
      { i18nKey: "theme.themePresentationLabel" },
    ],
    includeHomeInBreadcrumbs: true,
    homeHref: "/",
    homeI18nKey: "common.home",
  };

  return (
    <CiPage
      name={"dashboard-theme-presentation"}
      setup={pageSetup}
      context={context}
    >
      <CiThemePresentationPage />
    </CiPage>
  );
}
