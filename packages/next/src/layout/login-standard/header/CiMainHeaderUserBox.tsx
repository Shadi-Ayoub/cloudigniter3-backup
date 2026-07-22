// import dynamic from "next/dynamic";
import { CiNextLocaleSwitcher, CiThemeSwitcher } from "@ci-next/client";
import { CiNextProfileMenu } from "@ci-next/ui/client";
import type { CiNextPageConfig } from "@ci-next/types";

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
