import { CiPage } from "@cloudigniter/next/client";
import { CiPageWrapper, CiDashboardPage } from "@cloudigniter/next/ui/server";
import { appBootstrap } from "@/kernel/server";
import { setup } from "./setup";

export default async function CPHomePage() {
  const config = await appBootstrap();

  return (
    <CiPageWrapper config={config}>
      <CiPage
        name={"dashboard-homepage"}
        setup={{ showPageHeader: false }}
        config={config}
      >
        <CiDashboardPage setup={setup} config={config} />
      </CiPage>
    </CiPageWrapper>
  );
}
