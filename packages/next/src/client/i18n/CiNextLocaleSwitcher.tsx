"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  CI_DEFAULT_LOCALE,
  CI_DEFAULT_LOCALE_COOKIE_NAME,
  CI_DEFAULT_LOCALES,
  ciGetLangDir,
} from "@cloudigniter/core/lib";
import { CiLocaleSwitcher } from "@cloudigniter/core/client";
import { type CiI18nConfig } from "@cloudigniter/core/types";
import type { CiNextLocaleSwitcherProps } from "@ci-next/types";

export function CiNextLocaleSwitcher({
  traceConfig,
  config,
}: CiNextLocaleSwitcherProps) {
  const t = useTranslations("localeSwitcher");
  const locale = useLocale();
  const dir = ciGetLangDir(locale);
  const fullConfig = ensureLocaleConfig(config);

  const items = fullConfig.locales.map(
    (lang: { code: string; name: string }) => ({
      key: lang.code,
      label: t(lang.name.toLocaleLowerCase()), // in the language file, always make sure that the keys are in lowercase format except the connecting letter for the "camel-case" convention (primitive native text)
    }),
  );

  const localeName =
    items.find((item) => item.key === locale)?.label ?? "unknown";

  return (
    <>
      <CiLocaleSwitcher
        traceConfig={traceConfig}
        locale={{ code: locale, name: localeName, direction: dir }}
        menuItems={items}
        config={config}
      />
    </>
  );
}

/**
 * To ensure that config (of type LocaleConfig) is guaranteed to be fully
 * defined (i.e., all optional properties are assigned default values),
 * this utility function is used to fill in any missing properties with defaults.
 *
 * @param config
 * @returns
 */
function ensureLocaleConfig(config: CiI18nConfig): Required<CiI18nConfig> {
  return {
    locales: config.locales ?? CI_DEFAULT_LOCALES, // Default locales
    defaultLocale: config.defaultLocale ?? CI_DEFAULT_LOCALE, // Default locale
    cookieName: config.cookieName ?? CI_DEFAULT_LOCALE_COOKIE_NAME, // Default cookie name
  };
}
