/**
 * Environment variable name used by CloudIgniter handlers.
 */
export type CiEnvVarName = string;

/**
 * Convert a readonly env var tuple into a strongly typed object.
 *
 * Example:
 * ['CI_REGION', 'CI_SYSTEM_TABLE_NAME'] =>
 * {
 *   CI_REGION: string;
 *   CI_SYSTEM_TABLE_NAME: string;
 * }
 */
export type CiResolvedEnv<TEnvVars extends readonly CiEnvVarName[]> = {
  [K in TEnvVars[number]]: string;
};

/**
 * Core runtime environment variables guaranteed by the standardized
 * CloudIgniter handler wrapper.
 *
 * Notes
 * -----
 * - `CI_REGION` is used to build the default AWS client configuration.
 * - `CI_ENV_MODE` is commonly used by validation and runtime safety guards.
 */
export type CiCoreHandlerEnv = {
  CI_REGION: string;
  CI_ENV_MODE: string;
};

export type CiResolveRequiredEnvResult<TEnvVars extends readonly CiEnvVarName[]> =
  | {
      ok: true;
      env: CiResolvedEnv<TEnvVars>;
    }
  | {
      ok: false;
      missingEnvVar: TEnvVars[number];
    };

/**
 * Resolve required environment variables from `process.env`.
 *
 * Behavior
 * --------
 * - Returns `ok: false` when the first required variable is missing or blank.
 * - Returns `ok: true` with a typed `env` object when all variables exist.
 *
 * Why this helper exists
 * ----------------------
 * CloudIgniter handlers frequently depend on a small set of required runtime
 * values such as region, env mode, and table names. This helper centralizes
 * that resolution logic so handlers and wrappers do not repeat one-by-one
 * `process.env` assertions.
 *
 * Example
 * -------
 * ```ts
 * const result = ciResolveRequiredEnv([
 *   'CI_REGION',
 *   'CI_ENV_MODE',
 *   'CI_SYSTEM_TABLE_NAME',
 * ] as const);
 *
 * if (!result.ok) {
 *   console.error('Missing env var:', result.missingEnvVar);
 *   return;
 * }
 *
 * console.log(result.env.CI_REGION);
 * console.log(result.env.CI_SYSTEM_TABLE_NAME);
 * ```
 */
export function ciResolveRequiredEnv<TEnvVars extends readonly CiEnvVarName[]>(
  ciEnvVars: TEnvVars
): CiResolveRequiredEnvResult<TEnvVars> {
  const missingEnvVar = ciEnvVars.find((envKey) => {
    const value = process.env[envKey];
    return typeof value !== 'string' || value.trim() === '';
  });

  if (missingEnvVar) {
    return {
      ok: false,
      missingEnvVar,
    };
  }

  const env = Object.fromEntries(
    ciEnvVars.map((envKey) => [envKey, process.env[envKey] as string])
  ) as CiResolvedEnv<TEnvVars>;

  return {
    ok: true,
    env,
  };
}
