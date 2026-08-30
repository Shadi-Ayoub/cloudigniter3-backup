import type { CiOrgUnitContext } from "@ci-core/types";
import { ciOrgUnitAccessScope } from "../auth/access-control/ci-access-scope";

/**
 * Converts an authoritatively resolved request context into an authorization
 * scope. Descendant grants are evaluated against the stored predecessor IDs,
 * never against path segments supplied by a client.
 */
export function ciOrgUnitContextAccessScope(context: CiOrgUnitContext) {
  return ciOrgUnitAccessScope(
    context.tenantId,
    context.id,
    context.ancestorOrgUnitIds ?? [],
  );
}
