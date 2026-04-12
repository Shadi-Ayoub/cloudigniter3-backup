import dynamic from "next/dynamic";

import { CiRoundButtonFallback, type CiMainMenuItem } from "@/ui";
import { ciStartTrace, type CiSettings } from "@cloudigniter/core";
import type { CiResolvedPageConfig } from "@/.";

interface MainHeaderUserBoxInterface {
  config: CiResolvedPageConfig;
}
export function CiMainHeaderNavigationBox({
  config,
}: MainHeaderUserBoxInterface) {
  const settings = config.settings as CiSettings;

  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTrace(
    config.ciConfig.traceLog,
    { source: "server", prettyWave: true },
    { name: "<Header>" },
  );

  logger.log({
    scope: "layout",
    event: `Rendering the <MainHeaderNavigationBox> component`,
  });
  //////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * [Lazy load interactive client components]
   * Client components are "lazy loaded" using React.lazy or dynamic imports to reduce the initial load time.
   * set ssr to false in cases where the client component need to be rendered on the client side
   */
  const MainMenu = dynamic(() => import("@/ui").then((mod) => mod.CiMainMenu), {
    ssr: true,
    loading: () => <CiRoundButtonFallback config={config} />,
  });

  return (
    <nav aria-label="User Navigation" className="ci-main-header-user-box">
      <div className="ci-main-header-navigation-box">
        <MainMenu config={settings.mainMenu as CiMainMenuItem[]} />
      </div>
      <div className="ci-main-header-navigation-box-inner-mobile">
        {/* <MobileMenuToggle /> */}
      </div>
    </nav>
  );
}
