import type { CiResourceDefinition } from "./CiResourceDefinition";
import type { CiResourceDomainDefinition } from "./CiResourceDomainDefinition";
import type { CiRoleDefinition } from "./CiRoleDefinition";

/** Complete, serializable authorization catalog consumed by an authorizer. */
export type CiAccessControlDefinition = {
  domains: readonly CiResourceDomainDefinition[];
  resources: readonly CiResourceDefinition[];
  roles: readonly CiRoleDefinition[];
};
