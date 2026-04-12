/**
 * CloudIgniter runtime environment modes.
 *
 * Order reflects the typical promotion path:
 * local → sandbox → dev → test → preview → staging → prod
 */
export type CiEnvMode =
  | 'local' // Local machine (no AWS or minimal mocked services)
  | 'sandbox' // Amplify per-developer cloud environment
  | 'dev' // Shared development environment
  | 'test' // QA / automated testing
  | 'preview' // Ephemeral PR / feature-preview environment
  | 'staging' // Pre-production, production-like
  | 'prod'; // Production (live)
