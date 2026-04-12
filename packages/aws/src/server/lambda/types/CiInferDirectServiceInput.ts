import type { CiResponse } from "@cloudigniter/core";

/**
 * Infer the input type from a direct-input service function.
 */
export type CiInferDirectServiceInput<TService> = TService extends (
  input: infer TInput,
) => Promise<CiResponse>
  ? TInput
  : never;
