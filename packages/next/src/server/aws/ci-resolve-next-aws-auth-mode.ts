import { cookies } from "next/headers";
import {
  ciResolveAwsAuthMode,
  type CiAwsAuthMode,
} from "@cloudigniter/aws/server";
import { ciGetNextAmplifyServerRunner } from "./ci-get-next-amplify-server-runner";

/**
 * Resolve the AWS auth mode for the current Next.js server request.
 *
 * Overview
 * --------
 * This helper is the Next.js adapter/wrapper around the framework-agnostic
 * AWS helper `ciResolveAwsAuthMode(...)`.
 *
 * The AWS helper only knows how to answer:
 *
 * - "is there an authenticated Amplify server session?"
 *
 * It does not know how to obtain or pass a Next.js server context. This helper
 * supplies that missing bridge by:
 *
 * 1. reading the current Next.js cookies function
 * 2. adapting the generic AWS runner contract to the Next.js Amplify adapter
 * 3. delegating the actual auth-mode decision to the AWS helper
 *
 * Why this split is useful
 * ------------------------
 * This architecture keeps responsibilities separated:
 *
 * - AWS package:
 *   provider-specific auth decision logic
 *
 * - Next package:
 *   framework-specific request context plumbing
 *
 * That means the AWS package no longer imports:
 *
 * - `next/headers`
 * - `@aws-amplify/adapter-nextjs`
 * - Next.js-specific context shapes
 *
 * @param runWithAmplifyServerContext
 * The reusable Next.js Amplify server runner produced by
 * `ciGetNextAmplifyServerRunner(...)`.
 *
 * @returns
 * A Promise resolving to the AWS auth mode that should be used for the current
 * Next.js server request:
 *
 * - `"userPool"` when an authenticated server session exists
 * - `"apiKey"` when the request should be treated as guest/public
 *
 * @example
 * ```ts
 * const runWithAmplifyServerContext =
 *   ciGetNextAmplifyServerRunner(amplifyOutputs);
 *
 * const authMode = await ciResolveNextAwsAuthMode(
 *   runWithAmplifyServerContext
 * );
 * ```
 */
export async function ciResolveNextAwsAuthMode(
  runWithAmplifyServerContext: ReturnType<typeof ciGetNextAmplifyServerRunner>,
): Promise<CiAwsAuthMode> {
  return ciResolveAwsAuthMode(
    ({ serverContext, operation }) =>
      runWithAmplifyServerContext({
        nextServerContext: serverContext,
        operation,
      }),
    { cookies },
  );
}
