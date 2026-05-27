/**
 * CloudIgniter runtime environment modes.
 *
 * Order reflects the typical promotion path:
 * local → sandbox → dev → test → preview → staging → prod
 */
export type CiEnvMode =
  | "development" // Local development
  | "test" // Automated testing
  | "staging" // Pre-production validation
  | "production"; // Live production system
