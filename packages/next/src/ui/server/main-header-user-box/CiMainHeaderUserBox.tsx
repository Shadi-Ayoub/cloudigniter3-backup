import { ciStartTraceServer } from "@cloudigniter/core/server";
import { CiNextLocaleSwitcher, CiThemeSwitcher } from "@ci-next/client";
import { CiNextProfileMenu } from "@ci-next/ui/client";
import type { CiMainHeaderUserBoxProps } from "./types";

export function CiMainHeaderUserBox({ config }: CiMainHeaderUserBoxProps) {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTraceServer(
    config.coreConfig.dev.traceLog,
    { source: "server", prettyWave: true },
    { name: "<MainHeaderUserBox>" },
  );

  logger.log({
    scope: "ui",
    event: `Rendering the <MainHeaderUserBox> component`,
  });
  //////////////////////////////////////////////////////////////////////////////////////////////////

  return (
    <nav aria-label="User Navigation" className="ci-main-header-user-box">
      <div className="ci-main-header-user-box-inner">
        <CiThemeSwitcher
          config={config}
          dir={config.resolvedCoreConfig.direction}
        />
        <CiNextLocaleSwitcher
          config={config.coreConfig.i18n}
          traceConfig={config.coreConfig.dev.traceLog}
        />
        <CiNextProfileMenu
          config={config}
          dir={config.resolvedCoreConfig.direction}
        />
      </div>
      <div className="ci-main-header-user-box-inner-mobile">
        {/* <MobileMenuToggle /> */}
      </div>
    </nav>
  );
}
