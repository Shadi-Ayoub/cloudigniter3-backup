import { ciStartTraceServer } from "@cloudigniter/core/server";
import { CiNextLocaleSwitcher, CiThemeSwitcher } from "@ci-next/client";
import { CiNextProfileMenu } from "@ci-next/ui/client";
import type { CiNextPageConfig } from "@ci-next/types";

interface MainHeaderUserBoxInterface {
  config: CiNextPageConfig;
}

export function MainHeaderUserBox({ config }: MainHeaderUserBoxInterface) {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTraceServer(
    config.coreConfig.dev.traceLog,
    { source: "server", prettyWave: true },
    { name: "<MainHeaderUserBox>" },
  );

  logger.log({
    scope: "layout",
    event: `Rendering the <Container> component`,
  });
  //////////////////////////////////////////////////////////////////////////////////////////////////

  return (
    <nav
      aria-label="User Navigation"
      className="flex items-center space-x-4 ltr:mr-8 rtl:ml-8"
    >
      <div className="hidden flex-wrap gap-2 md:flex">
        <CiThemeSwitcher
          dir={config.resolvedCoreConfig.direction}
          config={config}
        />
        <CiNextLocaleSwitcher
          config={config.coreConfig.i18n}
          traceConfig={config.coreConfig.dev.traceLog}
        />
        <CiNextProfileMenu
          dir={config.resolvedCoreConfig.direction}
          config={config}
        />
      </div>
      <div className="flex md:hidden">{/* <MobileMenuToggle /> */}</div>
    </nav>
  );
}
