import { CiPage } from "@cloudigniter/next/client";
import { CiPageWrapper } from "@cloudigniter/next/server";
import { CiNextDashboardCard } from "@cloudigniter/next/ui/client";
import { CiDashboardPage } from "@cloudigniter/ui/server";
import { appBootstrap } from "@/kernel/server";
import { setup } from "./setup";

export default async function CPHomePage() {
  const context = await appBootstrap();

  return (
    <CiPageWrapper context={context}>
      <CiPage name={"dashboard-homepage"} setup={{ showPageHeader: false }} context={context}>
        <CiDashboardPage
          setup={setup}
          renderCard={(card) => <CiNextDashboardCard {...card} />}
        />
      </CiPage>
    </CiPageWrapper>
  );
}
