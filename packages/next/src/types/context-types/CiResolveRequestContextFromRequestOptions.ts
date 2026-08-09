import type { NextRequest } from "next/server";

export interface CiResolveRequestContextFromRequestOptions {
  request: Pick<NextRequest, "cookies" | "headers">;
  headerName?: string;
  cookieName?: string;
  preferredSource?: "header" | "cookie";

  /**
   * When provided, only a resolved context for this public or feature
   * pathname is returned. This prevents stale request transports from being
   * used for a different browser route.
   */
  pathname?: string;
}
