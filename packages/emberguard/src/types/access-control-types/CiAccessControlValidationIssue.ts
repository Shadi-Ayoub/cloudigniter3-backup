/** Structured catalog validation problem suitable for tooling and admin UIs. */
export type CiAccessControlValidationIssue = {
  severity: "error" | "warning";
  code:
    | "invalid-identifier"
    | "invalid-title"
    | "duplicate-identifier"
    | "invalid-precedence"
    | "invalid-domain-status"
    | "invalid-role-status"
    | "empty-list"
    | "unknown-domain"
    | "unknown-resource"
    | "unknown-action"
    | "unknown-role"
    | "role-cycle"
    | "unsupported-scope"
    | "broad-wildcard";
  path: string;
  message: string;
};
