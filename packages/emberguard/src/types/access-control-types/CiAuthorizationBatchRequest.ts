import type { CiAccessRequirement } from "./CiAccessRequirement";
import type { CiAccessScope } from "./CiAccessScope";
import type { CiAuthorizationSubject } from "./CiAuthorizationSubject";

/** Input used to test several requirements against one subject and scope. */
export type CiAuthorizationBatchRequest = {
  subject: CiAuthorizationSubject;
  scope: CiAccessScope;
  requirements: readonly CiAccessRequirement[];
};
