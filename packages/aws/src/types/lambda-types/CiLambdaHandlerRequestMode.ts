/**
 * Supported request parsing modes for standardized handlers.
 *
 * - `ci-request`:
 *   Expects `event.arguments.inputString` to contain a serialized `CiRequest<TInput>`.
 *
 * - `direct-input`:
 *   Expects `event.arguments.inputString` to contain a serialized raw `TInput`.
 *   The wrapper internally adapts it into a minimal `CiRequest<TInput>`.
 */
export type CiLambdaHandlerRequestMode = "ci-request" | "direct-input";
