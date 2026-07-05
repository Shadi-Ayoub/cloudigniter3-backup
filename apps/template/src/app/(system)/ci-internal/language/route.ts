/**
 * Try the below URLs in the browser:
 * http://localhost:3000/ci-internal/language?pathname=/dashboard
 * http://localhost:3000/ci-internal/language?pathname=/dashboard&detail=messages
 */

import type { NextRequest } from "next/server";
import {
  ciGetLangDir,
  ciNormalizePathname,
  ciNormalizeThrownError,
} from "@cloudigniter/core/lib";
import type { CiServerErrorPayload } from "@cloudigniter/core/types";
import { ciGetServerLocale } from "@cloudigniter/next/server";

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
  const value = request.nextUrl.searchParams.get("pathname");

  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return ciNormalizePathname(value);
}

function ciGetErrorPayload(error: unknown): CiServerErrorPayload {
  const errorObj = ciNormalizeThrownError(error);

  try {
    const payload = JSON.parse(errorObj.message) as CiServerErrorPayload;

    if (
      typeof payload.title === "string" &&
      typeof payload.message === "string"
    ) {
      return payload;
    }
  } catch {
    // Fall through to the standard payload.
  }

  return {
    title: "Language Diagnostics Failed!",
    message: errorObj.message,
    severity: "critical",
    showRetry: true,
  };
}

export async function GET(request: NextRequest) {
  if (!ciIsDevBeaconLanguageDiagnosticsEnabled()) {
    return new Response(null, {
      status: 404,
      headers: responseHeaders,
    });
  }

  const urlPath = ciGetRequestedPathname(request);

  if (!urlPath) {
    return Response.json(
      {
        error: {
          title: "Invalid Language Diagnostics Request!",
          message:
            'The "pathname" query parameter must be a valid absolute pathname.',
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
          message:
            'The "detail" query parameter must be either "summary" or "messages".',
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

  try {
    const loc = await ciGetServerLocale({
      cookieName: config.i18n.cookieName,
      defaultLocale: config.i18n.defaultLocale,
    });

    const result = await ciLoadRouteMessages({
      localeCode: loc.code,
      urlPath,
      includeMessageEntries: detail === "messages",
    });

    return Response.json(
      {
        locale: result.locale,
        dir: ciGetLangDir(result.locale),
        urlPath: result.urlPath,
        namespace: result.namespace,
        requestedFileNames: result.requestedFileNames,
        diagnostics: result.diagnostics,
        ...(detail === "messages"
          ? {
              effectiveMessages: result.effectiveMessages,
              sourceMessages: result.sourceMessages,
            }
          : {}),
      },
      {
        status: 200,
        headers: responseHeaders,
      },
    );
  } catch (error) {
    return Response.json(
      {
        error: ciGetErrorPayload(error),
      },
      {
        status: 500,
        headers: responseHeaders,
      },
    );
  }
}
