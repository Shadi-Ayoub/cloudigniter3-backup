import type { CiAccessControlDefinition } from "./CiAccessControlDefinition";
import type { CiActionDefinition } from "./CiActionDefinition";
import type { CiPrivilege } from "./CiPrivilege";
import type { CiResourceDefinition } from "./CiResourceDefinition";
import type { CiResourceDomainDefinition } from "./CiResourceDomainDefinition";
import type { CiRoleDefinition } from "./CiRoleDefinition";

/** Partial action entry used to add to or override an action by identifier. */
export type CiActionDefinitionLayer = Pick<CiActionDefinition, "id"> &
  Partial<Omit<CiActionDefinition, "id">>;

/** Partial domain entry used to add to or override a domain by identifier. */
export type CiResourceDomainDefinitionLayer = Pick<CiResourceDomainDefinition, "id"> &
  Partial<Omit<CiResourceDomainDefinition, "id">>;

/** Partial privilege entry used to add to or override a privilege by identifier. */
export type CiPrivilegeLayer = Pick<CiPrivilege, "id"> & Partial<Omit<CiPrivilege, "id">>;

/** Partial resource entry whose nested actions are merged by identifier. */
export type CiResourceDefinitionLayer = Pick<CiResourceDefinition, "id"> &
  Partial<Omit<CiResourceDefinition, "id" | "actions">> & {
    actions?: readonly CiActionDefinitionLayer[];
  };

/** Partial role entry whose nested privileges are merged by identifier. */
export type CiRoleDefinitionLayer = Pick<CiRoleDefinition, "id"> &
  Partial<Omit<CiRoleDefinition, "id" | "privileges">> & {
    privileges?: readonly CiPrivilegeLayer[];
  };

/**
 * One access-control configuration layer.
 *
 * Collections and their nested entries are merged by `id`; ordinary arrays
 * such as `scopeKinds` and `inherits` replace the value from the earlier layer.
 */
export type CiAccessControlLayer = Partial<
  Omit<CiAccessControlDefinition, "domains" | "resources" | "roles">
> & {
  domains?: readonly CiResourceDomainDefinitionLayer[];
  resources?: readonly CiResourceDefinitionLayer[];
  roles?: readonly CiRoleDefinitionLayer[];
};
