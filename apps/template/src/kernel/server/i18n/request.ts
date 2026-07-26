import { headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { CI_DEFAULT_REQUEST_CONTEXT_HEADER_NAME, ciDeserializeRequestContext } from "@cloudigniter/core/lib";

import type { CiServerErrorPayload } from "@cloudigniter/core/types";

import { ciGetServerLocale } from "@cloudigniter/next/server";

import config from "@/../cloudigniter.config";

import { ciLoadRouteMessages } from "./messages";

function ciCreateRequestConfigError(message: string): Error {
  return new Error(
    JSON.stringify({
      title: "Resolving Language File Failed!",
      message,
      severity: "critical",
      showRetry: true,
    } satisfies CiServerErrorPayload),
  );
}

export default getRequestConfig(async () => {
  const locale = await ciGetServerLocale({
    cookieName: config.i18n.cookieName,
    defaultLocale: config.i18n.defaultLocale,
  });

  const headerStore = await headers();

  // throw new Error(JSON.stringify([...headerStore.keys()].sort(), null, 2));

  const requestContextHeaderName = config.app?.requestContextHeaderName ?? CI_DEFAULT_REQUEST_CONTEXT_HEADER_NAME;

  const serializedRequestContext = headerStore.get(requestContextHeaderName);

  if (!serializedRequestContext) {
    throw ciCreateRequestConfigError(
      `[i18n.request.ts] The CloudIgniter request-context header (${requestContextHeaderName}) is missing!`,
    );
  }

  const requestContext = (() => {
    try {
      return ciDeserializeRequestContext(serializedRequestContext);
    } catch {
      return null;
    }
  })();

  if (!requestContext) {
    throw ciCreateRequestConfigError("[i18n.request.ts] The CloudIgniter request-context header is invalid!");
  }

  if (!requestContext.route) {
    throw ciCreateRequestConfigError("[i18n.request.ts] No resolved route exists in the current request context!");
  }

  const result = await ciLoadRouteMessages({
    localeCode: locale.code,
    namespace: requestContext.route.namespace,
    pathname: requestContext.route.pathname,
  });

  /*
   * Only return properties supported by next-intl's RequestConfig.
   * Route diagnostic information remains available from ciLoadRouteMessages().
   */
  return {
    locale: result.locale,
    messages: result.messages,
  };
});
