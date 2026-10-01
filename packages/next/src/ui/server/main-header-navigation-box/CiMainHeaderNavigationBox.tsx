import { ciStartTraceServer } from "@cloudigniter/core/server";
import { CiMainMenuSettingsSchema } from "@cloudigniter/core/lib";
import { CiNextMainMenu } from "@ci-next/ui/client";
import type { CiNextContext } from "@ci-next/types";

interface MainHeaderUserBoxInterface {
  context: CiNextContext;
}

export function CiMainHeaderNavigationBox({
  context,
}: MainHeaderUserBoxInterface) {
  const menu = CiMainMenuSettingsSchema.safeParse(
    context.settings?.private?.["private.navigation"]?.items,
  );
  const mainMenuConfig = menu.success ? menu.data : [];

  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTraceServer(
    context.config.appCoreConfig.dev.traceLog,
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
        <CiNextMainMenu config={mainMenuConfig} />
      </div>
      <div className="ci-main-header-navigation-box-inner-mobile">
        {/* <MobileMenuToggle /> */}
      </div>
    </nav>
  );
}
