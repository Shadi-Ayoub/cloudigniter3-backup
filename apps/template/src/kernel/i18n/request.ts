import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { deepmerge } from 'deepmerge-ts';
import type { AbstractIntlMessages } from 'next-intl';

import { getServerLocale } from '@cloudigniter/next/server';
import { getErrorMessage, resolveRoute } from '@cloudigniter/next/utility';
import { pascalToKebab } from '@cloudigniter/next/utility';
import { CI_DEFAULT_ROUTE_PATHNAME_COOKIE_NAME } from '@cloudigniter/next/constants';
import type { RoutesMap, CiServerErrorPayload } from '@cloudigniter/next/types';

import config from '@/../cloudigniter.config';

import { locale } from '@cloudigniter/next/locale';

export default getRequestConfig(async () => {
  try {
    const loc = await getServerLocale({
      cookieName: config.i18n.cookieName,
      defaultLocale: config.i18n.defaultLocale,
    });

    // Source of truth for the path: try cookie first and then header
    const ck = await cookies();
    const ciPath =
      ck.get(
        config.route.pathnameCookieName ?? CI_DEFAULT_ROUTE_PATHNAME_COOKIE_NAME
      )?.value ?? null;

    let urlPath = ciPath ?? '';

    if (urlPath === '') {
      const hdr = await headers();
      urlPath = hdr.get('x-ci-request-path') ?? '';
    }

    if (urlPath === '') {
      throw new Error(
        JSON.stringify({
          title: 'Resolving Language File Failed!',
          message: `[request.ts] The URL path for the current route could not be resolved!`,
          severity: 'critical',
          showRetry: true,
        } satisfies CiServerErrorPayload)
      );
    }

    // Resolve route → namespace
    const routes = config.routes as RoutesMap;
    const route = resolveRoute(urlPath, routes);

    if (!route) {
      throw new Error(
        JSON.stringify({
          title: 'Resolving Language File Failed!',
          message: `[request.ts] The route for the URL path "${urlPath}" is not registered in the CloudIgniter's configuration file!`,
          severity: 'critical',
          showRetry: true,
        } satisfies CiServerErrorPayload)
      );
    }

    let commonMessages = {};
    let namespaceMessages = {};
    let customCommonMessages = {};
    let customNamespaceMessages = {};

    try {
      commonMessages = locale[loc]['common'];

      customCommonMessages = (await import(`../../locale/${loc}/common.json`))
        .default;
    } catch (error) {
      console.log(
        `Could not load the common language file for the route "${route?.namespace}"! Error: ${getErrorMessage(error)}`
      );
    }

    if (route !== null) {
      // If we have a named route, load “namespace” JSON files:
      const nsKebab = pascalToKebab(route.namespace);

      try {
        namespaceMessages = locale[loc][nsKebab];
        customNamespaceMessages = (
          await import(`../../locale/${loc}/${nsKebab}.json`)
        ).default;
      } catch (error) {
        console.log(
          `Could not load the current route language file for the route "${route?.namespace}"! Error: ${getErrorMessage(error)}`
        );
      }
    }

    const systemMessages = deepmerge(
      commonMessages,
      namespaceMessages
    ) as AbstractIntlMessages;

    const customMessages = deepmerge(
      customCommonMessages,
      customNamespaceMessages
    ) as AbstractIntlMessages;

    const messages = deepmerge(
      systemMessages,
      customMessages
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
