import type { CiCoreFunctionId } from "./functions";

/**
 * Final per-handler environment map used by the post-build layer.
 *
 * Shape:
 * {
 *   someHandler: {
 *     SOME_ENV_KEY: 'value',
 *   },
 * }
 */
export type CiEnvMap = Partial<
  Record<CiCoreFunctionId, Record<string, string>>
>;
