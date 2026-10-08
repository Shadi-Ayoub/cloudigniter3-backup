import CiLayout from "@cloudigniter/next/layout/app-standard";
import { CiPage } from "@cloudigniter/next/client";
import { CiAboutBorderBeam } from "@cloudigniter/ui/client";

import { appBootstrap } from "@/kernel/server";

export default async function HomePage() {
  const context = await appBootstrap();

  return (
    <CiLayout context={context} protect={false}>
      <CiPage name={"homepage"} setup={{ showPageHeader: false, showBreadcrumbs: false }} context={context}>
        <CiAboutBorderBeam
          traceConfig={context.config.appCoreConfig.dev.traceLog}
          options={{ duration: 8, size: 200 }}
        />
      </CiPage>
    </CiLayout>
  );
}
