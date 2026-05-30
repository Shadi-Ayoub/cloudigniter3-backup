import dynamic from "next/dynamic";
import { CiRoundButtonFallback } from "@ci-next/ui";
import type { CiNextPageConfig } from "@ci-next/types";
// import { LocaleSwitcher } from '@CI/ui/components';

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
    <nav
      aria-label="User Navigation"
      className="flex items-center space-x-4 ltr:mr-8 rtl:ml-8"
    >
      <div className="hidden flex-wrap gap-2 md:flex">
        <ThemeSwitcher dir={config.ciConfig.direction} config={config} />
        <LocaleSwitcher
          config={config.ciConfig.i18n}
          traceConfig={config.ciConfig.dev.traceLog}
        />
        <ProfileMenu dir={config.ciConfig.direction} config={config} />
      </div>
      <div className="flex md:hidden">{/* <MobileMenuToggle /> */}</div>
    </nav>
  );
}
