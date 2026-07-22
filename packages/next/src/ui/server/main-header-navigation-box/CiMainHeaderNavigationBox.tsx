import { ciStartTraceServer } from "@cloudigniter/core/server";
import type { CiMainMenuItem } from "@cloudigniter/core/types";
import { CiMainMenu } from "@cloudigniter/ui/server";
import type { CiNextPageConfig } from "@ci-next/types";

interface MainHeaderUserBoxInterface {
  config: CiNextPageConfig;
}

export function CiMainHeaderNavigationBox({
  config,
}: MainHeaderUserBoxInterface) {
  const mainMenuConfig = config.settings?.private.mainMenu as CiMainMenuItem[];

  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTraceServer(
    config.coreConfig.dev.traceLog,
    { source: "server", prettyWave: true },
    { name: "<Header>" },
  );

  logger.log({
    scope: "layout",
    event: `Rendering the <MainHeaderNavigationBox> component`,
  });
  //////////////////////////////////////////////////////////////////////////////////////////////////

  return (
    <nav aria-label="User Navigation" className="ci-main-header-user-box">
      <div className="ci-main-header-navigation-box">
        <CiMainMenu config={mainMenuConfig} />
      </div>
      <div className="ci-main-header-navigation-box-inner-mobile">
        {/* <MobileMenuToggle /> */}
      </div>
    </nav>
  );
}
