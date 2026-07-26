import "server-only";

import { cache } from "react";
import { headers } from "next/headers";

import { CI_DEFAULT_REQUEST_CONTEXT_HEADER_NAME, ciDeserializeRequestContext } from "@cloudigniter/core/lib";
import type { CiRequestContext } from "@cloudigniter/core/types";

/**
 * Reads and deserializes the unified CloudIgniter request context
 * forwarded by Proxy.
 *
 * Returns null when the header does not exist. A malformed header throws
 * because it indicates that Proxy and the server are using incompatible
 * request-context formats.
 */
export const ciGetRequestContext = cache(
  async (headerName: string = CI_DEFAULT_REQUEST_CONTEXT_HEADER_NAME): Promise<CiRequestContext | null> => {
    const headerStore = await headers();
    const serializedContext = headerStore.get(headerName);

    if (!serializedContext) {
      return null;
    }

    try {
      const requestContext = ciDeserializeRequestContext(serializedContext);

      if (requestContext.schemaVersion !== 1) {
        throw new Error(`Unsupported request-context schema version: ${requestContext.schemaVersion}`);
      }

      return requestContext;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown deserialization error.";

      throw new Error(`Unable to deserialize the "${headerName}" header: ${message}`);
    }
  },
);
