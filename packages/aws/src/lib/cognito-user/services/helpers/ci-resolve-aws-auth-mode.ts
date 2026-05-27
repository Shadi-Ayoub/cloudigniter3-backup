import { getCurrentUser } from "aws-amplify/auth/server";

import type { CiAwsAuthMode } from "@ci-aws/types";

/**
 * Generic server-context runner contract used by AWS auth helpers.
 *
 * Purpose
 * -------
 * CloudIgniter's AWS package should not know anything about a specific web
 * framework or runtime adapter such as:
 *
 * - Next.js App Router
 * - Express
 * - Fastify
 * - custom Lambda HTTP wrappers
 *
 * However, AWS Amplify server-side auth APIs such as `getCurrentUser(...)`
 * must execute inside a provider-specific "server context runner".
 *
 * This type models that requirement in a framework-agnostic way.
 *
 * Design
 * ------
 * A caller supplies:
 *
 * 1. `serverContext`
 *    A framework/runtime-specific context object. Examples:
 *    - Next.js: `{ cookies }`
 *    - another runtime: request headers / cookies / request object
 *
 * 2. `operation`
 *    A callback that receives the Amplify `contextSpec` object and executes
 *    a server-side Amplify API such as `getCurrentUser(...)`.
 *
 * The runner is responsible for translating `serverContext` into the
 * corresponding runtime-specific call contract.
 *
 * Why this exists
 * ---------------
 * This type is the key abstraction that removes framework coupling from the
 * AWS package. The AWS package only requires:
 *
 * - a way to run an Amplify server operation
 * - a framework-provided context object
 *
 * It does not require any dependency on:
 *
 * - `next/headers`
 * - `@aws-amplify/adapter-nextjs`
 * - `nextServerContext`
 *
 * @typeParam TServerContext
 * The framework/runtime-specific context object that the caller wants to pass
 * into the server runner.
 *
 * @example
 * ```ts
 * const authMode = await ciResolveAwsAuthMode(
 *   ({ serverContext, operation }) =>
 *     runWithAmplifyServerContext({
 *       nextServerContext: serverContext,
 *       operation,
 *     }),
 *   { cookies }
 * );
 * ```
 */
export type CiAwsServerContextRunner<TServerContext> = <TResult>(args: {
  /**
   * Runtime/framework-specific context data required by the runner.
   */
  serverContext: TServerContext;

  /**
   * Amplify server operation to execute once the runner has established the
   * correct provider/runtime context.
   */
  operation: (
    contextSpec: Parameters<typeof getCurrentUser>[0],
  ) => Promise<TResult> | TResult;
}) => Promise<TResult>;

/**
 * Resolve the AWS Amplify authentication mode for the current server request.
 *
 * Overview
 * --------
 * In a CloudIgniter application backed by AWS Amplify, server-side operations
 * may support more than one authentication mode, for example:
 *
 * - `userPool` for authenticated users
 * - `apiKey` for public / guest access
 *
 * This helper determines which AWS auth mode should be used by attempting to
 * resolve the currently authenticated user through Amplify's server-side auth
 * API (`getCurrentUser(...)`).
 *
 * How it works
 * ------------
 * 1. The caller provides a framework-specific server runner and server context.
 * 2. This function asks that runner to execute `getCurrentUser(...)`.
 * 3. If `getCurrentUser(...)` succeeds, the request is treated as authenticated
 *    and the function returns `"userPool"`.
 * 4. If `getCurrentUser(...)` throws, the function falls back to `"apiKey"`.
 *
 * Why this helper belongs in the AWS package
 * ------------------------------------------
 * This helper is AWS/Amplify-specific because:
 *
 * - it uses `getCurrentUser(...)` from `aws-amplify/auth/server`
 * - it returns AWS auth-mode values (`"userPool"` / `"apiKey"`)
 *
 * But it remains framework-agnostic because the caller supplies the runner
 * abstraction instead of the helper importing a framework adapter directly.
 *
 * Error handling
 * --------------
 * The function intentionally catches all errors. In this context, the absence
 * of an authenticated session is a normal runtime scenario, not an exceptional
 * failure. Therefore:
 *
 * - authenticated session found -> `"userPool"`
 * - session missing / not resolvable -> `"apiKey"`
 *
 * @typeParam TServerContext
 * Type of the runtime/framework-specific context object used by the supplied
 * server runner.
 *
 * @param runWithServerContext
 * A framework/runtime-specific runner capable of executing Amplify server-side
 * auth operations inside an isolated request context.
 *
 * @param serverContext
 * Context data required by the supplied runner.
 *
 * @returns
 * A Promise resolving to the AWS auth mode that should be used for the request:
 *
 * - `"userPool"` when an authenticated server session is present
 * - `"apiKey"` when the request should be treated as public/guest
 *
 * @example
 * ```ts
 * const authMode = await ciResolveAwsAuthMode(
 *   ({ serverContext, operation }) =>
 *     runWithAmplifyServerContext({
 *       nextServerContext: serverContext,
 *       operation,
 *     }),
 *   { cookies }
 * );
 * ```
 */
export async function ciResolveAwsAuthMode<TServerContext>(
  runWithServerContext: CiAwsServerContextRunner<TServerContext>,
  serverContext: TServerContext,
): Promise<CiAwsAuthMode> {
  try {
    await runWithServerContext({
      serverContext,
      operation: (contextSpec) => getCurrentUser(contextSpec),
    });

    return "userPool";
  } catch {
    return "apiKey";
  }
}
