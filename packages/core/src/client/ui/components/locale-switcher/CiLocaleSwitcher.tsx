"use client";

import { useEffect } from "react";
import { ciStartTraceClient } from "@ci-core/client";
// import type { CiI18nConfig } from "../../common";
import LocaleSwitcherSelect from "./CiLocaleSwitcherSelect";
import { type CiLocaleSwitcherProps } from "@ci-core/types";

export function CiLocaleSwitcher({
  traceConfig,
  menuItems,
  locale,
  config,
}: CiLocaleSwitcherProps) {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger, done } = ciStartTraceClient(
    traceConfig,
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

  if (config.locales && config.locales?.length <= 1) {
    return null;
  }

  // const t = useTranslations("localeSwitcher");
  // const locale = useLocale();

  // const fullConfig = ensureLocaleConfig(config);

  // const items = fullConfig.locales.map(
  //   (lang: { code: string; name: string }) => ({
  //     key: lang.code,
  //     label: lang.name.toLocaleLowerCase(),
  //     // label: t(lang.name.toLocaleLowerCase()), // in the language file, always make sure that the keys are in lowercase format except the connecting letter for the "camel-case" convention (primitive native text)
  //   }),
  // );

  return (
    <>
      <LocaleSwitcherSelect
        dir={locale?.direction ?? "ltr"}
        defaultValue={locale?.code ?? "en"}
        menuItems={menuItems}
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
// function ensureLocaleConfig(config: CiI18nConfig): Required<CiI18nConfig> {
//   return {
//     locales: config.locales ?? [{ code: "en", name: "English" }], // Default locales
//     defaultLocale: config.defaultLocale ?? "en", // Default locale
//     cookieName: config.cookieName ?? "ci-locale", // Default cookie name
//   };
// }
