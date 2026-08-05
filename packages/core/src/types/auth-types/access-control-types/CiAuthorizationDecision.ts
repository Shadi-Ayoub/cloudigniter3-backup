import type { CiAuthorizationDecisionReason } from "./CiAuthorizationDecisionReason";
import type { CiAuthorizationMatch } from "./CiAuthorizationMatch";
import type { CiPrivilegeEffect } from "./CiPrivilegeEffect";

/** Auditable result returned instead of a bare authorization boolean. */
export type CiAuthorizationDecision = {
  allowed: boolean;
  effect: CiPrivilegeEffect;
  reason: CiAuthorizationDecisionReason;
  matches: readonly CiAuthorizationMatch[];
  decidingMatches: readonly CiAuthorizationMatch[];
  evaluatedRoleIds: readonly string[];
};
