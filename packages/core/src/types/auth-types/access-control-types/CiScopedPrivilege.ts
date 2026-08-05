import type { CiAccessScope } from "./CiAccessScope";
import type { CiGrantWindow } from "./CiGrantWindow";
import type { CiPrivilege } from "./CiPrivilege";
import type { CiScopePropagation } from "./CiScopePropagation";

/** Direct subject privilege scoped independently of a role. */
export type CiScopedPrivilege = CiGrantWindow & {
  privilege: CiPrivilege;
  scope: CiAccessScope;
  propagation: CiScopePropagation;
};
