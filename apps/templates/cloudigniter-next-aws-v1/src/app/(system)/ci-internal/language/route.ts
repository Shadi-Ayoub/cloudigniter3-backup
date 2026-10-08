/**
 * Try the URLs below in the browser:
 * http://localhost:3000/ci-internal/dev-beacon/language?pathname=/dashboard
 * http://localhost:3000/ci-internal/dev-beacon/language?pathname=/dashboard&detail=messages
 */

import type { NextRequest } from "next/server";

import {
  CI_DEFAULT_REQUEST_CONTEXT_COOKIE_NAME,
  CI_DEFAULT_REQUEST_CONTEXT_HEADER_NAME,
  ciGetLangDir,
  ciNormalizePathname,
  ciNormalizeThrownError,
} from "@cloudigniter/core/lib";

import type { CiServerErrorPayload } from "@cloudigniter/core/types";
import {
  ciGetServerLocale,
  ciResolveRequestContextFromRequest,
} from "@cloudigniter/next/server";

import config from "@/../cloudigniter.config";
import { ciLoadRouteMessages } from "@/kernel/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const responseHeaders = {
  "Cache-Control": "no-store",
};

function ciIsDevBeaconLanguageDiagnosticsEnabled(): boolean {
  // Keep this aligned with the condition used to render CiDebugProbe.
  return process.env.NODE_ENV !== "production";
}

function ciGetRequestedPathname(request: NextRequest): string | null {
  const pathname = request.nextUrl.searchParams.get("pathname")?.trim();

  if (!pathname || !pathname.startsWith("/") || pathname.startsWith("//")) {
    return null;
  }

  return ciNormalizePathname(pathname);
}

function ciIsServerErrorPayload(value: unknown): value is CiServerErrorPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Record<string, unknown>;

  return typeof payload.title === "string" && typeof payload.message === "string";
}

function ciGetErrorPayload(error: unknown): CiServerErrorPayload {
  const normalizedError = ciNormalizeThrownError(error);

  try {
    const parsedMessage: unknown = JSON.parse(normalizedError.message);

    if (ciIsServerErrorPayload(parsedMessage)) {
      return parsedMessage;
    }
  } catch {
    // The error message is not a serialized CiServerErrorPayload.
  }

  return {
    title: "Language Diagnostics Failed!",
    message: normalizedError.message,
    severity: "critical",
    showRetry: true,
  };
}

// function ciGetRequestRoute(request: NextRequest) {
//   const requestContextHeaderName =
//     config.request.context.requestContextHeaderName ?? CI_DEFAULT_REQUEST_CONTEXT_HEADER_NAME;

//   const serializedRequestContext = request.headers.get(requestContextHeaderName);

//   if (!serializedRequestContext) {
//     throw new Error(
//       JSON.stringify({
//         title: "Language Diagnostics Failed!",
//         message: `The CloudIgniter request-context header ` + `(${requestContextHeaderName}) is missing.`,
//         severity: "critical",
//         showRetry: true,
//       } satisfies CiServerErrorPayload),
//     );
//   }

//   const requestContext = (() => {
//     try {
//       return ciDeserializeRequestContext(serializedRequestContext);
//     } catch {
//       return null;
//     }
//   })();

//   if (!requestContext) {
//     throw new Error(
//       JSON.stringify({
//         title: "Language Diagnostics Failed!",
//         message: "The CloudIgniter request-context header is invalid.",
//         severity: "critical",
//         showRetry: true,
//       } satisfies CiServerErrorPayload),
//     );
//   }

//   if (!requestContext.route) {
//     throw new Error(
//       JSON.stringify({
//         title: "Language Diagnostics Failed!",
//         message: "No resolved route exists in the current request context.",
//         severity: "critical",
//         showRetry: true,
//       } satisfies CiServerErrorPayload),
//     );
//   }

//   return requestContext.route;
// }

function ciCreateLanguageDiagnosticsError(message: string): Error {
  return new Error(
    JSON.stringify({
      title: "Language Diagnostics Failed!",
      message,
      severity: "critical",
      showRetry: true,
    } satisfies CiServerErrorPayload),
  );
}

export async function GET(request: NextRequest) {
  if (!ciIsDevBeaconLanguageDiagnosticsEnabled()) {
    return new Response(null, {
      status: 404,
      headers: responseHeaders,
    });
  }

  const pathname = ciGetRequestedPathname(request);

  if (!pathname) {
    return Response.json(
      {
        error: {
          title: "Invalid Language Diagnostics Request!",
          message: 'The "pathname" query parameter must be a valid absolute pathname.',
          severity: "critical",
          showRetry: false,
        } satisfies CiServerErrorPayload,
      },
      {
        status: 400,
        headers: responseHeaders,
      },
    );
  }

  const detail = request.nextUrl.searchParams.get("detail") ?? "summary";

  if (detail !== "summary" && detail !== "messages") {
    return Response.json(
      {
        error: {
          title: "Invalid Language Diagnostics Request!",
          message: 'The "detail" query parameter must be either "summary" or "messages".',
          severity: "critical",
          showRetry: false,
        } satisfies CiServerErrorPayload,
      },
      {
        status: 400,
        headers: responseHeaders,
      },
    );
  }

  let stage = "resolving locale";

  try {
    const resolvedLocale = await ciGetServerLocale({
      cookieName: config.i18n.cookieName,
      defaultLocale: config.i18n.defaultLocale,
    });

    const localeCode = typeof resolvedLocale?.code === "string" ? resolvedLocale.code.trim() : "";

    if (!localeCode) {
      throw ciCreateLanguageDiagnosticsError("The resolved locale code is missing.");
    }

    stage = "resolving request context";

    const requestContext = ciResolveRequestContextFromRequest({
      request,
      pathname,
      headerName:
        config.request.context.requestContextHeaderName ??
        CI_DEFAULT_REQUEST_CONTEXT_HEADER_NAME,
      cookieName:
        config.request.context.requestContextCookieName ??
        CI_DEFAULT_REQUEST_CONTEXT_COOKIE_NAME,
      preferredSource: "cookie",
    });

    if (!requestContext) {
      throw ciCreateLanguageDiagnosticsError(
        `No resolved request context matches the requested pathname "${pathname}".`,
      );
    }

    const route = requestContext.route;

    if (!route) {
      throw ciCreateLanguageDiagnosticsError("No resolved route exists in the current request context.");
    }

    const namespace = typeof route.namespace === "string" ? route.namespace.trim() : "";

    if (!namespace) {
      throw ciCreateLanguageDiagnosticsError("The resolved route namespace is missing.");
    }

    const routePathname = typeof route.pathname === "string" ? route.pathname.trim() : "";

    if (!routePathname) {
      throw ciCreateLanguageDiagnosticsError("The resolved route pathname is missing.");
    }

    stage = "loading route messages";

    const result = await ciLoadRouteMessages({
      localeCode,
      namespace,
      pathname: ciNormalizePathname(routePathname),
      includeMessageEntries: detail === "messages",
    });

    stage = "building diagnostics response";

    return Response.json(
      {
        locale: localeCode,
        dir: ciGetLangDir(localeCode),
        urlPath: result.urlPath ?? routePathname,
        namespace: result.namespace ?? namespace,
        requestedFileNames: result.requestedFileNames ?? [],
        diagnostics: result.diagnostics,
        ...(detail === "messages"
          ? {
              effectiveMessages: result.effectiveMessages ?? {},
              sourceMessages: result.sourceMessages ?? {},
            }
          : {}),
      },
      {
        status: 200,
        headers: responseHeaders,
      },
    );
  } catch (error) {
    const payload = ciGetErrorPayload(error);

    console.error(`[DevBeacon language diagnostics: ${stage}]`, error);

    return Response.json(
      {
        error: {
          ...payload,
          message: `[${stage}] ${payload.message}`,
        },
      },
      {
        status: 500,
        headers: responseHeaders,
      },
    );
  }
}
