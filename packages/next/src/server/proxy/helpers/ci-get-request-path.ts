import { headers } from "next/headers";
import { ciNormalizePath } from "@cloudigniter/core/helpers";
import { ciGetNextServerCookie } from "../../cookie";

export async function ciGetRequestPath(opts?: {
  headerName?: string; // default: 'x-ci-request-path'
  cookieName?: string; // default: 'ci-request-path'
}): Promise<string | null> {
  const headerName = (opts?.headerName ?? "x-ci-request-path").toLowerCase();
  const cookieName = opts?.cookieName ?? "ci-request-path";

  // 1) Prefer the middleware-set header on this request
  const h = await headers();
  const fromHeader = h.get(headerName) ?? h.get(headerName.toUpperCase());
  if (fromHeader) return ciNormalizePath(fromHeader);

  // 2) Fallback to the cookie via your utility
  const fromCookie = await ciGetNextServerCookie(cookieName);
  if (fromCookie) return ciNormalizePath(fromCookie);

  return null;
}
