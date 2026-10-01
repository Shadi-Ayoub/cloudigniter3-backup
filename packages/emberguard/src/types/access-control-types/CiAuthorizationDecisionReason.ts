/** Stable explanation code returned by every authorization decision. */
export type CiAuthorizationDecisionReason =
  | "allowed"
  | "explicit-deny"
  | "read-only"
  | "unauthenticated"
  | "unknown-resource"
  | "unknown-action"
  | "unsupported-scope"
  | "suspended-domain"
  | "suspended-resource"
  | "suspended-role"
  | "no-role-assignment"
  | "no-matching-privilege";
