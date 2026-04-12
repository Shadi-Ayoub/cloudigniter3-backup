import type { CiCoreFunctionId } from "../core-types/functions";
import type { CiTableGrantSpec } from "../core-types/tables";
// import type { CiPolicyStatementInput } from './policy';

/**
 * Group-based bundle shape used only by the policy normalization/reporting layer.
 *
 * Important
 * ---------
 * This is intentionally different from the operational fragment model:
 *
 * - Operational/build model:
 *   CiPolicyFragment
 *
 * - Normalization/reporting model:
 *   CiNormalizedPolicyBundle
 *
 * Keeping the two models separate avoids type collisions and makes the policy
 * pipeline easier to reason about.
 */
export type CiNormalizedPolicyBundle = Record<string, CiPolicyGroup>;

/**
 * Logical group of related policy statements.
 */
export type CiPolicyGroup = {
  /**
   * Optional human-readable description for reports/debugging.
   */
  description?: string;

  /**
   * Optional provenance marker.
   * Examples:
   * - cloudigniter-core
   * - template-app
   * - plugin-users
   */
  source?: string;

  /**
   * Statements contributed by this group.
   */
  statements: CiPolicyStatement[];
};

/**
 * CloudIgniter-friendly statement shape used before final IAM normalization.
 */
export type CiPolicyStatement = {
  sid?: string;
  effect: "Allow" | "Deny";
  actions?: string | string[];
  notActions?: string | string[];
  resources?: string | string[];
  notResources?: string | string[];
  conditions?: Record<string, Record<string, unknown>>;
};

/**
 * Final IAM-style statement shape produced by normalization.
 *
 * IMPORTANT:
 * This is intentionally different from `CiPolicyStatementInput`.
 */
export type CiPolicyStatementSpec = {
  Sid?: string;
  Effect: "Allow" | "Deny";
  Action?: string | string[];
  NotAction?: string | string[];
  Resource?: string | string[];
  NotResource?: string | string[];
  Condition?: Record<string, Record<string, unknown>>;
};

/**
 * Final normalized IAM-style policy document.
 */
export type CiPolicyDocument = {
  Version: "2012-10-17";
  Statement: CiPolicyStatementSpec[];
};

/**
 * Operational fragment used by the post-build layer.
 */
export type CiPolicyFragment = {
  inlinePolicies?: CiInlinePolicySpec[];
  commonStatements?: CiPolicyStatementInput[];
  tableGrants?: CiTableGrantSpec[];
};

export type CiInlinePolicySpec = {
  for: CiCoreFunctionId;
  statements: CiPolicyStatementInput[];
  id?: string;
};

// export type { CiPolicyStatementInput };

/**
 * Low-level IAM-friendly policy input primitives shared across backend layers.
 *
 * These types are intentionally kept outside `policy/types.ts` so other modules
 * can depend on them without introducing a dependency on the broader policy
 * normalization/reporting model.
 */

export type CiPolicyEffect = "Allow" | "Deny";

export type CiPolicyStatementInput = {
  effect: CiPolicyEffect;
  actions: string[];
  resources: string[];
};

export interface CiPreparedPolicyInterface {
  inlinePolicies: CiInlinePolicySpec[];
  commonStatements: CiPolicyStatementInput[];
  tableGrants: CiTableGrantSpec[];
  normalizedPolicyDocument: CiPolicyDocument;
}

/**
 * Canonical simplified statement shape used by the post-build layer before
 * conversion into concrete CDK/IAM statements.
 */
// export type CiPolicyStatementSpec = CiPolicyStatementInput;
