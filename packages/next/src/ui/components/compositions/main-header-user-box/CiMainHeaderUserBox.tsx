import dynamic from "next/dynamic";
import { CiRoundButtonFallback } from "@/ui";
import { ciStartTrace } from "@cloudigniter/core";
import type { CiMainHeaderUserBoxProps } from "./types";

export function CiMainHeaderUserBox({ config }: CiMainHeaderUserBoxProps) {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTrace(
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
    () => import("@/ui").then((mod) => mod.CiThemeSwitcher),
    {
      ssr: true,
      loading: () => <CiRoundButtonFallback config={config} />,
    },
  );

  const LocaleSwitcher = dynamic(
    () => import("@/i18n").then((mod) => mod.CiLocaleSwitcher),
    {
      ssr: true,
      loading: () => <CiRoundButtonFallback config={config} />,
    },
  );

  const ProfileMenu = dynamic(
    () => import("@/ui").then((mod) => mod.CiProfileMenu),
    {
      ssr: true,
      loading: () => <CiRoundButtonFallback config={config} />,
    },
  );

  return (
    <nav aria-label="User Navigation" className="ci-main-header-user-box">
      <div className="ci-main-header-user-box-inner">
        <ThemeSwitcher config={config} dir={config.ciConfig.direction} />
        <LocaleSwitcher config={config} dir={config.ciConfig.direction} />
        <ProfileMenu config={config} dir={config.ciConfig.direction} />
      </div>
      <div className="ci-main-header-user-box-inner-mobile">
        {/* <MobileMenuToggle /> */}
      </div>
    </nav>
  );
}
