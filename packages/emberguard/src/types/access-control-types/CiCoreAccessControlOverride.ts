import type { CiAccessControlDefinition } from "./CiAccessControlDefinition";
import type { CiAccessControlLayer } from "./CiAccessControlLayer";
import type { CiAuthorizationSubject } from "./CiAuthorizationSubject";

/** Immutable audit record for one authorized overlay of core catalog entries. */
export type CiCoreAccessControlOverride = {
  schemaVersion: 1;
  id: string;
  previousRevision: number;
  revision: number;
  reason: string;
  actorId: string;
  createdAt: string;
  layer: CiAccessControlLayer;
};

/** Input required to authorize and create one core catalog override record. */
export type CiCreateCoreAccessControlOverrideInput = {
  id: string;
  expectedRevision: number;
  reason: string;
  subject: CiAuthorizationSubject;
  currentDefinition: CiAccessControlDefinition;
  layer: CiAccessControlLayer;
};

/** Injectable runtime options for deterministic core override creation. */
export type CiCreateCoreAccessControlOverrideOptions = {
  clock?: () => Date;
};
