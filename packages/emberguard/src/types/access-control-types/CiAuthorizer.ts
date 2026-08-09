import type { CiAccessControlDefinition } from "./CiAccessControlDefinition";
import type { CiAuthorizationBatchRequest } from "./CiAuthorizationBatchRequest";
import type { CiAuthorizationDecision } from "./CiAuthorizationDecision";
import type { CiAuthorizationRequest } from "./CiAuthorizationRequest";

/** Compiled access-control facade for repeated authorization checks. */
export type CiAuthorizer = {
  readonly definition: CiAccessControlDefinition;
  authorize: (request: CiAuthorizationRequest) => CiAuthorizationDecision;
  can: (request: CiAuthorizationRequest) => boolean;
  canAny: (request: CiAuthorizationBatchRequest) => boolean;
  canAll: (request: CiAuthorizationBatchRequest) => boolean;
};
