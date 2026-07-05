import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { CI_DEFAULT_ROUTE_PATHNAME_COOKIE_NAME } from "@cloudigniter/core/lib";
import type { CiServerErrorPayload } from "@cloudigniter/core/types";
import { ciGetServerLocale } from "@cloudigniter/next/server";

import config from "@/../cloudigniter.config";
import { ciLoadRouteMessages } from "./messages";

export default getRequestConfig(async () => {
  const loc = await ciGetServerLocale({
    cookieName: config.i18n.cookieName,
    defaultLocale: config.i18n.defaultLocale,
  });

  const ck = await cookies();

  let urlPath =
    ck.get(
      config.route.pathnameCookieName ?? CI_DEFAULT_ROUTE_PATHNAME_COOKIE_NAME,
    )?.value ?? "";

  if (urlPath === "") {
    const hdr = await headers();
    urlPath = hdr.get("x-ci-request-path") ?? "";
  }

  if (urlPath === "") {
    throw new Error(
      JSON.stringify({
        title: "Resolving Language File Failed!",
        message:
          "[request.ts] The URL path for the current route could not be resolved!",
        severity: "critical",
        showRetry: true,
      } satisfies CiServerErrorPayload),
    );
  }

  const result = await ciLoadRouteMessages({
    localeCode: loc.code,
    urlPath,
  });

  return {
    locale: result.locale,
    messages: result.messages,
    urlPath: result.urlPath,
  };
});
