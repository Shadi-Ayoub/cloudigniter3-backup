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
// import { CI_DEFAULT_ROUTE_PATHNAME_COOKIE_NAME } from "@cloudigniter/next/constants";
import type {
  CiRoutesMap,
  CiServerErrorPayload,
} from "@cloudigniter/core/types";

import config from "@/../cloudigniter.config";

import { locales } from "@cloudigniter/next/locales";

export default getRequestConfig(async () => {
  // const ck = await cookies();
  // const hdr = await headers();

  try {
    const loc = await ciGetServerLocale({
      cookieName: config.i18n.cookieName,
      defaultLocale: config.i18n.defaultLocale,
    });

    // const loc =
    //   ck.get(config.i18n.cookieName)?.value ??
    //   config.i18n.defaultLocale ??
    //   "ci-locale";

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

    // Source of truth for the path: try cookie first and then header
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

    // Resolve route → namespace
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

      customCommonMessages = (
        await import(`../../../locales/${loc}/common.json`)
      ).default;
    } catch (error) {
      const errorObj = ciNormalizeThrownError(error);
      console.log(
        `Could not load the common language file for the route "${route?.namespace}"! Error: ${errorObj.message}`,
      );
    }

    if (route !== null) {
      // If we have a named route, load “namespace” JSON files:
      const nsKebab = ciPascalToKebab(route.namespace);

      try {
        namespaceMessages = locales[loc][nsKebab] ?? {};
        customNamespaceMessages = (
          await import(`../../../locales/${loc}/${nsKebab}.json`)
        ).default;
      } catch (error) {
        const errorObj = ciNormalizeThrownError(error);
        console.log(
          `Could not load the current route language file for the route "${route?.namespace}"! Error: ${errorObj.message}`,
        );
      }
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
