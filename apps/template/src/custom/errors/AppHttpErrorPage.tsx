import { createTranslator } from "next-intl";
import { ciGetServerLocale } from "@cloudigniter/next/server";
import { CiNextHttpErrorPage } from "@cloudigniter/next/ui/server";
import config from "@/../cloudigniter.config";
import { ciLoadRouteMessages } from "@/kernel/server/i18n/messages";
import { appIsPageAccessSuspended } from "./app-is-page-access-suspended";

/** Application branding and common-locale overrides, independent of page bootstrap. */
export async function AppHttpErrorPage({
  statusCode,
}: {
  statusCode: 403 | 404;
}) {
  const requestedLocale = await ciGetServerLocale(config.i18n);
  const locale = config.i18n.locales.some(
    ({ code }) => code === requestedLocale.code
  )
    ? requestedLocale.code
    : config.i18n.defaultLocale;
  const { messages } = await ciLoadRouteMessages({
    localeCode: locale,
    namespace: "common",
    pathname: "/",
  });
  const t = createTranslator({ locale, messages, namespace: "httpErrors" });
  const accessSuspended =
    statusCode === 403 && (await appIsPageAccessSuspended());
  const messageKey = accessSuspended ? "suspended" : `${statusCode}`;
  return (
    <CiNextHttpErrorPage
      statusCode={statusCode}
      accessSuspended={accessSuspended}
      imageSrc={
        statusCode === 403
          ? accessSuspended
            ? "/images/logo-access-not-allowed-1.png"
            : "/images/logo-access-denied-1.png"
          : "/images/logo-not-found-1.png"
      }
      messages={{
        title: t(`${messageKey}.title`),
        message: t(`${messageKey}.message`),
        errorLabel: t("errorLabel"),
        homeLabel: t("homeLabel"),
      }}
    />
  );
}
