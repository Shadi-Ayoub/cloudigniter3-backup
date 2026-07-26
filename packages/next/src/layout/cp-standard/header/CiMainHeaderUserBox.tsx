import { ciStartTraceServer } from "@cloudigniter/core/server";
import { CiNextLocaleSwitcher, CiThemeSwitcher } from "@ci-next/client";
import { CiNextProfileMenu } from "@ci-next/ui/client";
import type { CiNextContext } from "@ci-next/types";

interface MainHeaderUserBoxInterface {
  context: CiNextContext;
}

export function MainHeaderUserBox({ context }: MainHeaderUserBoxInterface) {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTraceServer(
    context.config.appCoreConfig.dev.traceLog,
    { source: "server", prettyWave: true },
    { name: "<MainHeaderUserBox>" },
  );

  logger.log({
    scope: "layout",
    event: `Rendering the <Container> component`,
  });
  //////////////////////////////////////////////////////////////////////////////////////////////////

  return (
    <nav aria-label="User Navigation" className="flex items-center space-x-4 ltr:mr-8 rtl:ml-8">
      <div className="hidden flex-wrap gap-2 md:flex">
        <CiThemeSwitcher dir={context.config.appResolvedCoreConfig.direction} config={context.config} />
        <CiNextLocaleSwitcher
          config={context.config.appCoreConfig.i18n}
          traceConfig={context.config.appCoreConfig.dev.traceLog}
        />
        <CiNextProfileMenu dir={context.config.appResolvedCoreConfig.direction} config={context.config} />
      </div>
      <div className="flex md:hidden">{/* <MobileMenuToggle /> */}</div>
    </nav>
  );
}
