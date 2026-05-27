import dynamic from "next/dynamic";
import { CiRoundButtonFallback } from "@ci-next/ui";
import { ciStartTraceServer } from "@cloudigniter/core/server";
import type { CiMainHeaderUserBoxProps } from "./types";

export function CiMainHeaderUserBox({ config }: CiMainHeaderUserBoxProps) {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTraceServer(
    config.ciConfig.traceLog,
    { source: "server", prettyWave: true },
    { name: "<MainHeaderUserBox>" },
  );

  logger.log({
    scope: "ui",
    event: `Rendering the <MainHeaderUserBox> component`,
  });
  //////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * [Lazy load interactive client components]
   * Client components are "lazy loaded" using React.lazy or dynamic imports to reduce the initial load time.
   * set ssr to false in cases where the client component nees to be rendered on the client side
   */
  const ThemeSwitcher = dynamic(
    () => import("@ci-next/client").then((mod) => mod.CiThemeSwitcher),
    {
      ssr: true,
      loading: () => <CiRoundButtonFallback />,
    },
  );

  const LocaleSwitcher = dynamic(
    () => import("@ci-next/client").then((mod) => mod.CiNextLocaleSwitcher),
    {
      ssr: true,
      loading: () => <CiRoundButtonFallback />,
    },
  );

  const ProfileMenu = dynamic(
    () => import("@ci-next/ui/client").then((mod) => mod.CiProfileMenu),
    {
      ssr: true,
      loading: () => <CiRoundButtonFallback />,
    },
  );

  return (
    <nav aria-label="User Navigation" className="ci-main-header-user-box">
      <div className="ci-main-header-user-box-inner">
        <ThemeSwitcher config={config} dir={config.ciConfig.direction} />
        <LocaleSwitcher
          config={config.ciConfig.i18n}
          traceConfig={config.ciConfig.traceLog}
        />
        <ProfileMenu config={config} dir={config.ciConfig.direction} />
      </div>
      <div className="ci-main-header-user-box-inner-mobile">
        {/* <MobileMenuToggle /> */}
      </div>
    </nav>
  );
}
