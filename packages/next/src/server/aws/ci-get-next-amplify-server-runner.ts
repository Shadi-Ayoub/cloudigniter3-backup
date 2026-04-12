import { createServerRunner } from "@aws-amplify/adapter-nextjs";
import { type CiAmplifyOutputs } from "@cloudigniter/aws";

/**
 * Create a reusable AWS Amplify server runner for Next.js.
 *
 * Overview
 * --------
 * AWS Amplify's Next.js adapter exposes `createServerRunner(...)`, which
 * returns a `runWithAmplifyServerContext(...)` function. That runner is the
 * official mechanism used to execute Amplify server-side APIs within an
 * isolated Next.js request context.
 *
 * This helper wraps that setup so CloudIgniter can:
 *
 * - initialize the runner once
 * - reuse it throughout the application
 * - keep Next.js-specific adapter code out of the AWS package
 *
 * Why this helper belongs in the Next package
 * -------------------------------------------
 * This helper is inherently framework-specific because it depends on:
 *
 * - `@aws-amplify/adapter-nextjs`
 * - the Next.js request model
 *
 * Therefore it should remain in the Next package rather than the AWS package.
 *
 * Typical usage
 * -------------
 * Call this once during application bootstrap or in a central module, then
 * reuse the returned `runWithAmplifyServerContext(...)` function anywhere you
 * need to execute Amplify server-side APIs.
 *
 * @param config
 * Amplify outputs/configuration used to initialize the Next.js Amplify server
 * runner.
 *
 * @returns
 * The `runWithAmplifyServerContext(...)` function created by the Amplify
 * Next.js adapter.
 *
 * @example
 * ```ts
 * const runWithAmplifyServerContext =
 *   ciGetNextAmplifyServerRunner(amplifyOutputs);
 *
 * const result = await runWithAmplifyServerContext({
 *   nextServerContext: { cookies },
 *   operation: (contextSpec) => getCurrentUser(contextSpec),
 * });
 * ```
 */
export function ciGetNextAmplifyServerRunner(config: CiAmplifyOutputs) {
  const { runWithAmplifyServerContext } = createServerRunner({
    config,
  });

  return runWithAmplifyServerContext;
}
