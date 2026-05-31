import dynamic from "next/dynamic";
import { CiRoundButtonFallback } from "../../common";
import { ciStartTraceServer } from "../../../server";
import { CiNextLocaleSwitcher, CiThemeSwitcher } from "../../../client";
import { CiProfileMenu } from "../../client";
import type { CiMainHeaderUserBoxProps } from "./types";

export function CiMainHeaderUserBox({ config }: CiMainHeaderUserBoxProps) {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTraceServer(
    config.ciConfig.dev.traceLog,
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
        <CiThemeSwitcher config={config} dir={config.ciConfig.direction} />
        <CiNextLocaleSwitcher
          config={config.ciConfig.i18n}
          traceConfig={config.ciConfig.dev.traceLog}
        />
        <CiProfileMenu config={config} dir={config.ciConfig.direction} />
      </div>
      <div className="ci-main-header-user-box-inner-mobile">
        {/* <MobileMenuToggle /> */}
      </div>
    </nav>
  );
}
