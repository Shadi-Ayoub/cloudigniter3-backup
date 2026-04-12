/**
 * Optional debug metadata attached to a response.
 *
 * This shape stays runtime-agnostic. Provider/runtime-specific helpers
 * may populate these fields with richer values.
 */
export type CiResponseDebugMeta = {
  response?: unknown;
  event?: unknown;
  context?: unknown;
  env?: string[];
  metrics?: unknown | null;
  lastEventLog?: unknown | null;
};
