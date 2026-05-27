import { ciGetCookie } from "@ci-core/client";
import { ciNormalizePath } from "@ci-core/lib";

export function ciGetRequestPath(opts?: {
  cookieName?: string; // default: 'ci-request-path'
}): string {
  const cookieName = opts?.cookieName ?? "ci-request-path";

  // 1) Try middleware-set cookie
  const fromCookie = ciGetCookie(cookieName);

  // 2) Fallback to window.location.pathname
  const raw =
    fromCookie ??
    (typeof window !== "undefined" ? window.location.pathname : "/");
  return ciNormalizePath(raw) ?? "/";
}
