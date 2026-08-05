import type { CiAccessScope } from "./CiAccessScope";
import type { CiPrivilege } from "./CiPrivilege";

/** Matching policy evidence included in an authorization decision. */
export type CiAuthorizationMatch = {
  source: "role" | "direct";
  privilege: CiPrivilege;
  assignmentScope: CiAccessScope;
  assignedRoleId?: string;
  privilegeRoleId?: string;
  precedence: number | null;
};
