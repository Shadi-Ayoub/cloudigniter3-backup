import dynamic from 'next/dynamic';
import { RoundButtonFallback } from '@CI/ui/components';
import type { I18nConfig, ThemeConfig } from '@CI/types';

// import { LocaleSwitcher } from '@CI/ui/components';
import { startTrace } from '@CI/trace';
import type { CiPageConfig } from '@CI/types';

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
  config: CiPageConfig;
}

export function MainHeaderUserBox({ config }: MainHeaderUserBoxInterface) {
  const ThemeSwitcher = dynamic(() => import('@CI/ui/components').then((mod) => mod.ThemeSwitcher), {
    ssr: true,
    loading: () => <RoundButtonFallback config={config} />,
  });

  const LocaleSwitcher = dynamic(() => import('@CI/ui/components').then((mod) => mod.LocaleSwitcher), {
    ssr: true,
    loading: () => <RoundButtonFallback config={config} />,
  });

  const ProfileMenu = dynamic(() => import('@CI/ui/components').then((mod) => mod.ProfileMenu), {
    ssr: true,
    loading: () => <RoundButtonFallback config={config} />,
  });

  return (
    <nav aria-label='User Navigation' className='flex items-center space-x-4 ltr:mr-8 rtl:ml-8'>
      <div className='hidden flex-wrap gap-2 md:flex'>
        <ThemeSwitcher dir={config.ciConfig.direction} config={config} />
        <LocaleSwitcher dir={config.ciConfig.direction} config={config} />
        <ProfileMenu dir={config.ciConfig.direction} config={config} />
      </div>
      <div className='flex md:hidden'>{/* <MobileMenuToggle /> */}</div>
    </nav>
  );
}
