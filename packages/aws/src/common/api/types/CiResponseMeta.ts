import { type Context } from "aws-lambda";
import type { CiLambdaEvent } from "./";

export type CiResponseMeta = {
  message?: string;
  parameter?: string | null; // Passed parameter (json string)

  // Consider grouping debug-only members to avoid leaking them everywhere:
  debug?: {
    response?: unknown;
    event?: CiLambdaEvent;
    context?: Context;
    env?: string[];
    metrics?: unknown | null;
    lastEventLog?: unknown | null;
  };
};
