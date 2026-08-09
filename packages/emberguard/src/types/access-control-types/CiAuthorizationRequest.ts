import type { CiAccessScope } from "./CiAccessScope";
import type { CiAuthorizationSubject } from "./CiAuthorizationSubject";

/** One provider-neutral authorization request. */
export type CiAuthorizationRequest = {
  subject: CiAuthorizationSubject;
  resource: string;
  action: string;
  scope: CiAccessScope;
};
