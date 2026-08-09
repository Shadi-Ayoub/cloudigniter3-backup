import {
  CI_DEFAULT_REQUEST_CONTEXT_COOKIE_NAME,
  CI_DEFAULT_REQUEST_CONTEXT_HEADER_NAME,
  ciDeserializeRequestContext,
  ciNormalizePathname,
} from "@cloudigniter/core/lib";
import type { CiRequestContext, CiRoute } from "@cloudigniter/core/types";
import type { CiResolveRequestContextFromRequestOptions } from "@ci-next/types";

function ciDeserializeRequestContextCandidate(serializedContext: string | undefined | null): CiRequestContext | null {
  if (!serializedContext) {
    return null;
  }

  try {
    const context = ciDeserializeRequestContext(serializedContext);

    return context.schemaVersion === 1 ? context : null;
  } catch {
    return null;
  }
}

function ciRouteMatchesPathname(route: CiRoute | null, pathname: string): boolean {
  if (!route) {
    return false;
  }

  const normalizedPathname = ciNormalizePathname(pathname);

  return [route.publicPathname, route.pathname].some(
    (candidate) => ciNormalizePathname(candidate) === normalizedPathname,
  );
}

/**
 * Resolves a serialized CloudIgniter context from a concrete Next.js request.
 *
 * Both the proxy-only header and browser cookie are validated independently.
 * When a pathname is supplied, a candidate is accepted only when its resolved
 * route belongs to that pathname. The caller can then choose the transport
 * appropriate to its runtime boundary without an invalid or stale candidate
 * masking the other one.
 */
export function ciResolveRequestContextFromRequest({
  request,
  headerName = CI_DEFAULT_REQUEST_CONTEXT_HEADER_NAME,
  cookieName = CI_DEFAULT_REQUEST_CONTEXT_COOKIE_NAME,
  preferredSource = "header",
  pathname,
}: CiResolveRequestContextFromRequestOptions): CiRequestContext | null {
  const contexts = {
    header: ciDeserializeRequestContextCandidate(request.headers.get(headerName)),
    cookie: ciDeserializeRequestContextCandidate(request.cookies.get(cookieName)?.value),
  };
  const sourceOrder =
    preferredSource === "cookie"
      ? (["cookie", "header"] as const)
      : (["header", "cookie"] as const);
  const candidates = sourceOrder
    .map((source) => contexts[source])
    .filter((candidate): candidate is CiRequestContext => candidate !== null);

  if (pathname !== undefined) {
    return candidates.find((candidate) => ciRouteMatchesPathname(candidate.route, pathname)) ?? null;
  }

  return candidates.find((candidate) => candidate.route !== null) ?? candidates[0] ?? null;
}
