// import dynamic from "next/dynamic";
import { CiNextLocaleSwitcher, CiThemeSwitcher } from "../../../client";
import { CiProfileMenu } from "../../../ui/client";
import { CiRoundButtonFallback } from "../../../ui";
import type { CiNextPageConfig } from "../../../types";

interface MainHeaderUserBoxInterface {
  config: CiNextPageConfig;
}

export function MainHeaderUserBox({ config }: MainHeaderUserBoxInterface) {
  return (
    <nav
      aria-label="User Navigation"
      className="flex items-center space-x-4 ltr:mr-8 rtl:ml-8"
    >
      <div className="hidden flex-wrap gap-2 md:flex">
        <CiThemeSwitcher dir={config.ciConfig.direction} config={config} />
        <CiNextLocaleSwitcher
          config={config.ciConfig.i18n}
          traceConfig={config.ciConfig.dev.traceLog}
        />
        <CiProfileMenu dir={config.ciConfig.direction} config={config} />
      </div>
      <div className="flex md:hidden">{/* <MobileMenuToggle /> */}</div>
    </nav>
  );
}
