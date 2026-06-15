import type { CiPageSetup } from "@cloudigniter/core/types";
import { CiPage } from "@cloudigniter/next/client";
import { CiPageWrapper } from "@cloudigniter/next/ui/server";
import { CiThemePresentationPage } from "@cloudigniter/next/ui/client";
import { appBootstrap } from "@/kernel/server";

export default async function ThemePresentationPage() {
  const config = await appBootstrap();

  const pageSetup: CiPageSetup = {
    showPageHeader: false,
    showBreadcrumbs: true,
    breadcrumbs: [
      { i18nKey: "common.dashboard", href: "/dashboard" },
      { i18nKey: "theme.themePresentationLabel" },
    ],
    includeHomeInBreadcrumbs: true,
    homeHref: "/",
    homeI18nKey: "common.home",
  };

  return (
    <CiPageWrapper config={config}>
      <CiPage
        name={"dashboard-theme-presentation"}
        setup={pageSetup}
        config={config}
      >
        <CiThemePresentationPage />
      </CiPage>
    </CiPageWrapper>
  );
}
