import CiLayout from "@cloudigniter/next/layout/app-standard";
import { CiPage } from "@cloudigniter/next/client";
import { CiAboutBorderBeam } from "@cloudigniter/next/ui/client";

import { appBootstrap } from "@/kernel/server";

export default async function HomePage() {
  const config = await appBootstrap();

  return (
    <CiLayout config={config} protect={false}>
      <CiPage
        name={"homepage"}
        setup={{ showPageHeader: false, showBreadcrumbs: false }}
        config={config}
      >
        <CiAboutBorderBeam
          traceConfig={config.ciConfig.dev.traceLog}
          options={{ duration: 8, size: 200 }}
        />
      </CiPage>
    </CiLayout>
  );
}
