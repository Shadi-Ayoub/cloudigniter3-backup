import type { CiErrorPayload, CiJsonValue } from "@ci-core/types";
import type { CiResponseMeta } from "./CiResponseMeta";

export type CiResponseErrorOptions = {
  details?: CiJsonValue;
  extras?: Record<string, unknown>;
  errorMeta?: CiErrorPayload;
  meta?: CiResponseMeta;
};
