import type { CiAccessScopeKind } from "./CiAccessScopeKind";
import type { CiActionDefinition } from "./CiActionDefinition";

/** Canonical application resource and the actions and scopes it supports. */
export type CiResourceDefinition = {
  id: string;
  domainId: string;
  title: string;
  description?: string;
  actions: readonly CiActionDefinition[];
  scopeKinds: readonly CiAccessScopeKind[];
};
