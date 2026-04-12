import type { CiCoreAuthParams } from './auth';

/**
 * Options that influence how post-build plans are produced.
 *
 * Kept in a low-level file so resource/policy modules can depend on it
 * without importing the broader `src/backend/types.ts` barrel.
 */
export type CiPlanOptions = {
  /**
   * When true, auth-related env vars are included in the final env map.
   */
  includeAuthEnv?: boolean;

  /**
   * Optional auth parameters used by the auth env/policy preparation layer.
   */
  authParams?: CiCoreAuthParams;

  /**
   * When true, default DynamoDB IAM fragments are emitted by data resource modules.
   */
  includeDefaultDynamoPolicies?: boolean;
};
