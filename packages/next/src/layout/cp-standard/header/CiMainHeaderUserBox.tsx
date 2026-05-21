import dynamic from "next/dynamic";
import {
  ciStartTrace,
  // type CiI18nConfig,
  // type CiThemeConfig,
} from "@cloudigniter/core";
import { CiRoundButtonFallback } from "@/ui";
import type { CiNextPageConfig } from "@/page";
// import { CiTraceLogger } from "../../../../../core/dist/dev/trace/trace-logger";

// const LocaleSwitcher = dynamic(
//   () => import('../../../i18n').then((mod) => mod.LocaleSwitcher),
//   {
//     ssr: false,
//     loading: () => <RoundButtonFallback />,
//   }
// );

// interface Props {
//   direction: 'ltr' | 'rtl';
//   themeConfig: ThemeConfig;
//   localeConfig: I18nConfig;
// }

interface MainHeaderUserBoxInterface {
  config: CiNextPageConfig;
}

export function MainHeaderUserBox({ config }: MainHeaderUserBoxInterface) {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = ciStartTrace(
    config.ciConfig.traceLog,
    { source: "server", prettyWave: true },
    { name: "<MainHeaderUserBox>" },
  );

  logger.log({
    scope: "layout",
    event: `Rendering the <Container> component`,
  });
  //////////////////////////////////////////////////////////////////////////////////////////////////

  const ThemeSwitcher = dynamic(
    () => import("@/ui").then((mod) => mod.CiThemeSwitcher),
    {
      ssr: true,
      loading: () => <CiRoundButtonFallback config={config} />,
    },
  );

  const LocaleSwitcher = dynamic(
    () => import("@/ui").then((mod) => mod.CiNextLocaleSwitcher),
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
    <nav
      aria-label="User Navigation"
      className="flex items-center space-x-4 ltr:mr-8 rtl:ml-8"
    >
      <div className="hidden flex-wrap gap-2 md:flex">
        <ThemeSwitcher dir={config.ciConfig.direction} config={config} />
        <LocaleSwitcher
          config={config.ciConfig.i18n}
          traceConfig={config.ciConfig.traceLog}
        />
        <ProfileMenu dir={config.ciConfig.direction} config={config} />
      </div>
      <div className="flex md:hidden">{/* <MobileMenuToggle /> */}</div>
    </nav>
  );
}
