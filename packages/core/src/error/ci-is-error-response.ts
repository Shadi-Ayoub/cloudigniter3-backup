import type { CiResponse } from "@/types";

// Generic “is error response” guard.
// Works as long as your ok() uses 2xx and err() uses 4xx/5xx.
export function ciIsErrorResponse(r: CiResponse): boolean {
  return r.statusCode >= 400;
}
