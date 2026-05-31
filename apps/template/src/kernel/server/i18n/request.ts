import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { deepmerge } from "deepmerge-ts";
import type { AbstractIntlMessages } from "next-intl";

import { ciGetServerLocale } from "@cloudigniter/next/server";
import {
  CI_DEFAULT_ROUTE_PATHNAME_COOKIE_NAME,
  ciNormalizeThrownError,
  ciPascalToKebab,
  ciResolveRoute,
} from "@cloudigniter/core/lib";
import type {
  CiRoutesMap,
  CiServerErrorPayload,
} from "@cloudigniter/core/types";

import config from "@/../cloudigniter.config";

import { locales } from "@cloudigniter/next/locales";

type CiMessageModule = {
  default: AbstractIntlMessages;
};

type CiMessageLoader = () => Promise<CiMessageModule>;

const customLocaleLoaders = {
  en: {
    common: () => import("../../../locales/en/common.json"),
    // Add route namespaces here, for example:
    // dashboard: () => import("../../../locales/en/dashboard.json"),
  },
  ar: {
    common: () => import("../../../locales/ar/common.json"),
    // Add route namespaces here, for example:
    // dashboard: () => import("../../../locales/ar/dashboard.json"),
  },
} satisfies Record<string, Record<string, CiMessageLoader>>;

function ciIsCustomLocaleKey(
  value: string,
): value is keyof typeof customLocaleLoaders {
  return value in customLocaleLoaders;
}

async function ciLoadCustomMessages(
  loc: string,
  namespace: string,
): Promise<AbstractIntlMessages> {
  if (!ciIsCustomLocaleKey(loc)) {
    return {};
  }

  const loaders: Record<string, CiMessageLoader> = customLocaleLoaders[loc];
  const loader = loaders[namespace];

  if (!loader) {
    return {};
  }

  return (await loader()).default;
}

export default getRequestConfig(async () => {
  try {
    const loc = await ciGetServerLocale({
      cookieName: config.i18n.cookieName,
      defaultLocale: config.i18n.defaultLocale,
    });

    if (!locales[loc]) {
      throw new Error(
        JSON.stringify({
          title: "No locale is defined!",
          message: `[request.ts] No locale code was found in CloudIgniter's next package!`,
          severity: "critical",
          showRetry: true,
        } satisfies CiServerErrorPayload),
      );
    }

    const ck = await cookies();
    const ciPath =
      ck.get(
        config.route.pathnameCookieName ??
          CI_DEFAULT_ROUTE_PATHNAME_COOKIE_NAME,
      )?.value ?? null;

    let urlPath = ciPath ?? "";

    if (urlPath === "") {
      const hdr = await headers();
      urlPath = hdr.get("x-ci-request-path") ?? "";
    }

    if (urlPath === "") {
      throw new Error(
        JSON.stringify({
          title: "Resolving Language File Failed!",
          message: `[request.ts] The URL path for the current route could not be resolved!`,
          severity: "critical",
          showRetry: true,
        } satisfies CiServerErrorPayload),
      );
    }

    const routes = config.routes as CiRoutesMap;
    const route = ciResolveRoute(urlPath, routes);

    if (!route) {
      throw new Error(
        JSON.stringify({
          title: "Resolving Language File Failed!",
          message: `[request.ts] The route for the URL path "${urlPath}" is not registered in the CloudIgniter's configuration file!`,
          severity: "critical",
          showRetry: true,
        } satisfies CiServerErrorPayload),
      );
    }

    let commonMessages = {};
    let namespaceMessages = {};
    let customCommonMessages = {};
    let customNamespaceMessages = {};

    try {
      commonMessages = locales[loc]["common"] ?? {};
      customCommonMessages = await ciLoadCustomMessages(loc, "common");
    } catch (error) {
      const errorObj = ciNormalizeThrownError(error);
      console.log(
        `Could not load the common language file for the route "${route?.namespace}"! Error: ${errorObj.message}`,
      );
    }

    const nsKebab = ciPascalToKebab(route.namespace);

    try {
      namespaceMessages = locales[loc][nsKebab] ?? {};
      customNamespaceMessages = await ciLoadCustomMessages(loc, nsKebab);
    } catch (error) {
      const errorObj = ciNormalizeThrownError(error);
      console.log(
        `Could not load the current route language file for the route "${route?.namespace}"! Error: ${errorObj.message}`,
      );
    }

    const systemMessages = deepmerge(
      commonMessages,
      namespaceMessages,
    ) as AbstractIntlMessages;

    const customMessages = deepmerge(
      customCommonMessages,
      customNamespaceMessages,
    ) as AbstractIntlMessages;

    const messages = deepmerge(
      systemMessages,
      customMessages,
    ) as AbstractIntlMessages;

    return {
      locale: loc,
      messages,
      urlPath,
    };
  } catch (error) {
    throw error;
  }
});
