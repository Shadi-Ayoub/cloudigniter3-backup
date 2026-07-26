import { ciStartTraceServer } from "@cloudigniter/core/server";
import { CiNextLocaleSwitcher, CiThemeSwitcher } from "@ci-next/client";
import { CiNextProfileMenu } from "@ci-next/ui/client";
import type { CiMainHeaderUserBoxProps } from "./types";

export function CiMainHeaderUserBox({ context }: CiMainHeaderUserBoxProps) {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTraceServer(
    context.config.appCoreConfig.dev.traceLog,
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
        <CiThemeSwitcher config={context.config} dir={context.config.appResolvedCoreConfig.direction} />
        <CiNextLocaleSwitcher
          config={context.config.appCoreConfig.i18n}
          traceConfig={context.config.appCoreConfig.dev.traceLog}
        />
        <CiNextProfileMenu config={context.config} dir={context.config.appResolvedCoreConfig.direction} />
      </div>
      <div className="ci-main-header-user-box-inner-mobile">{/* <MobileMenuToggle /> */}</div>
    </nav>
  );
}
