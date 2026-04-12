"use client";

import { useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";

import { ciStartTrace, type CiI18nConfig } from "@cloudigniter/core";
import type { CiResolvedPageConfig } from "@/.";

import LocaleSwitcherSelect from "./CiLocaleSwitcherSelect";

interface LocaleSwitcherInterface {
  dir: "ltr" | "rtl";
  config: CiResolvedPageConfig;
}

export function CiLocaleSwitcher({ dir, config }: LocaleSwitcherInterface) {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger, done } = ciStartTrace(
    config.ciConfig.traceLog,
    // { source: 'client', tag: `LocaleSwitcher`, defaults: { component: 'LocaleSwitcher' } },
    { source: "client", tag: `LocaleSwitcher` },
    { name: `<LocaleSwitcher />` },
  );

  // log mount/unmount once
  useEffect(() => {
    // stop the render timer (records a "duration" metric if enabled)
    done({ phase: "mount" });

    logger.log({ type: "ui", event: "mount <LocaleSwitcher>" });
    return () => logger.log({ type: "ui", event: "unmount" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /////////////////////////////////////////////////////////////////////////////////////////

  if (config.ciConfig.i18n.locale && config.ciConfig.i18n.locale?.length <= 1) {
    return null;
  }

  const t = useTranslations("localeSwitcher");
  const locale = useLocale();

  const fullConfig = ensureLocaleConfig(config.ciConfig.i18n);

  const items = fullConfig.locale.map(
    (lang: { code: string; name: string }) => ({
      key: lang.code,
      label: t(lang.name.toLocaleLowerCase()), // in the language file, always make sure that the keys are in lowercase format except the connecting letter for the "camel-case" convention (primitive native text)
    }),
  );

  return (
    <>
      <LocaleSwitcherSelect
        dir={dir}
        defaultValue={locale}
        menuItems={items}
        config={config.ciConfig.i18n}
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
    locale: config.locale ?? [{ code: "en", name: "English" }], // Default locales
    defaultLocale: config.defaultLocale ?? "en", // Default locale
    cookieName: config.cookieName ?? "ci-locale", // Default cookie name
  };
}
