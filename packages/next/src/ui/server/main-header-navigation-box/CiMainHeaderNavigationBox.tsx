import dynamic from "next/dynamic";
import { ciStartTraceServer } from "../../../server";
import type { CiMainMenuItem } from "@cloudigniter/core/types";
import { type CiSettings } from "@cloudigniter/core/types";
import { CiMainMenu } from "../../server";
import { CiRoundButtonFallback } from "../../common";
import type { CiNextPageConfig } from "../../../types";

interface MainHeaderUserBoxInterface {
  config: CiNextPageConfig;
}

export function CiMainHeaderNavigationBox({
  config,
}: MainHeaderUserBoxInterface) {
  const settings = config.settings as CiSettings;

  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTraceServer(
    config.ciConfig.dev.traceLog,
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
        <CiMainMenu config={settings.mainMenu as CiMainMenuItem[]} />
      </div>
      <div className="ci-main-header-navigation-box-inner-mobile">
        {/* <MobileMenuToggle /> */}
      </div>
    </nav>
  );
}
