import type { CiSettings } from "@/.";

/**
 * Client-side map of resolved settings domains.
 *
 * Example:
 * {
 *   core: { applicationName: 'CloudIgniter' },
 *   branding: { logoUrl: '/logo.svg' },
 * }
 */
export type CiSettingsClientMap = Record<string, CiSettings>;
