import type { CiResponse } from "@cloudigniter/core/types";
/**
 * Standard CloudIgniter direct-input service function shape.
 */
export type CiDirectServiceFn<TInput> = (input: TInput) => Promise<CiResponse>;
