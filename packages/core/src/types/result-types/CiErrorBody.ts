import type { CiErrorPayload } from "./CiErrorPayload";
import type { CiJsonValue } from "./CiJsonValue";

export type CiErrorBody = {
  error: string;
  // fieldErrors?: CiFieldErrors;
  details?: CiJsonValue;
  errorMeta?: CiErrorPayload;
};
