import type { CiErrorPayload, CiJsonValue } from "./";

export type CiErrorBody = {
  error: string;
  // fieldErrors?: CiFieldErrors;
  details?: CiJsonValue;
  errorMeta?: CiErrorPayload;
};
