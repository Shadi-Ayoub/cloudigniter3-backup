import type { CiAccessScope } from "./CiAccessScope";
import type { CiGrantWindow } from "./CiGrantWindow";
import type { CiScopePropagation } from "./CiScopePropagation";

/** Assigns a reusable role to a subject at a concrete access boundary. */
export type CiRoleAssignment = CiGrantWindow & {
  roleId: string;
  scope: CiAccessScope;
  propagation: CiScopePropagation;
};
