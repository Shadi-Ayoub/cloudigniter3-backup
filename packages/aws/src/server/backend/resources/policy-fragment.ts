import type { CiPolicyFragment } from '../core-types/policy';

/**
 * Merge additive policy fragments.
 */
export function ciMergePolicyFragments(fragments: CiPolicyFragment[]): CiPolicyFragment {
  return fragments.reduce<CiPolicyFragment>(
    (acc, current) => ({
      inlinePolicies: [...(acc.inlinePolicies ?? []), ...(current.inlinePolicies ?? [])],
      commonStatements: [...(acc.commonStatements ?? []), ...(current.commonStatements ?? [])],
      tableGrants: [...(acc.tableGrants ?? []), ...(current.tableGrants ?? [])],
    }),
    {}
  );
}
