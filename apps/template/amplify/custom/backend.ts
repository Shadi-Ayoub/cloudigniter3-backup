import { customBackendAuth } from "./auth";
import customDataSchemas from "./data/schemata";

import type { CiBackend } from "../backend/types";

/**
 * Application-owned Amplify resources merged into `defineBackend(...)`.
 * Resource keys must not collide with CloudIgniter core resource keys.
 */
export const customBackendResources = {
  // sendInvoiceHandler,
  // auditEventsTable,
};

/** Application-owned additions to the Amplify Data schema. */
export { customBackendAuth, customDataSchemas };

export type CiCustomBackendContext = {
  /** The fully constructed Amplify backend, including custom resources. */
  backend: CiBackend;
};

/**
 * Configure application-owned CDK relationships after Amplify constructs exist.
 * Use this hook for grants, environment values, event sources, schedules, and
 * custom outputs that cannot be expressed by a resource factory alone.
 */
export function ciConfigureCustomBackend(
  _context: CiCustomBackendContext,
): void {
  // Example:
  // const { backend } = context;
  // backend.auditEventsTable.resources.table.grantReadWriteData(
  //   backend.sendInvoiceHandler.resources.lambda,
  // );
}
