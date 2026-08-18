// /**
//  * Why CloudIgniter uses a dedicated `publicSettings` table:
//  *
//  * CloudIgniter introduces a separate **`publicSettings`** table to deliberately support **unauthenticated, read-only access to
//  * non-sensitive configuration**, while preserving strict security boundaries for all other system data.
//  *
//  * This design addresses several core requirements:
//  * 1. **Unauthenticated bootstrap support**
//  *   Many CloudIgniter pages (login, onboarding, public landing routes, tenant discovery) must load configuration *before* a user
//  *   is authenticated. Using a dedicated `publicSettings` table allows these pages to retrieve essential settings (branding, feature
//  *   flags, menus, UI behavior) via **API Key–based access**, without requiring Cognito authentication.
//  *
//  * 2. **Strong security isolation**
//  *   AppSync authorization is enforced at the model level. Mixing public and private configuration in a single table would require
//  *   loosening access rules and risks accidental data exposure. By separating public settings into their own table, CloudIgniter
//  *   guarantees that:
//  *     * Public settings are **explicitly safe to expose**
//  *     * Private/system configuration remains protected by **Cognito User Pools or IAM**
//  *     * No future schema change can unintentionally expose sensitive data
//  *
//  * 3. **Clear intent and governance**
//  *   The existence of a `publicSettings` table makes exposure a **conscious architectural decision**, not an implementation side effect.
//  *   Developers must intentionally place configuration into the public domain, improving code review clarity, auditability, and long-term
//  *   governance.
//  *
//  * 4. **Scalability and maintainability**
//  *   Settings naturally grow over time. Storing them as **tenant-scoped, namespaced categories** (e.g., `branding`, `features`, `theme`)
//  *   avoids large monolithic payloads, reduces over-fetching, and allows independent evolution of configuration domains without breaking
//  *   clients.
//  *
//  * 5. **Safe use of API keys in sandbox and production**
//  *   API keys are not secrets and can be extracted from client bundles. CloudIgniter’s design ensures that API keys are used **only**
//  *   against a table whose contents are intentionally public and read-only, making their use acceptable even in production environments.
//  *
//  * 6. **Clean tenant-aware fallback patterns**
//  *   Public settings are stored per tenant, enabling predictable resolution flows such as:
//  *     * Tenant-specific settings
//  *     * Fallback to global/default settings
//  *   This logic remains simple, performant, and safe because all data involved is public by design.
//  *
//  * **In summary:**
//  * The `publicSettings` table exists to enable **secure, intentional, and scalable public configuration access** in
//  * CloudIgniter—without compromising system security, developer clarity, or future extensibility.
//  */

// import { a } from '@aws-amplify/backend';

// const schemaPublicSettings = {
//   PublicSettings: a
//     .model({
//       tenantId: a.string().required(), // "ats", "default", "global"
//       key: a.string().required(), // "core" | "branding" | "features" | ...
//       status: a.string(),
//       version: a.integer(),
//       data: a.json().required(),
//     })
//     .identifier(['tenantId', 'key'])
//     .secondaryIndexes((index) => [index('tenantId').name('byTenant')])
//     .authorization((allow) => [
//       allow.publicApiKey().to(['read']),
//       allow.group('system-admin').to(['create', 'read', 'update', 'delete']),
//     ]),
// };

// export default schemaPublicSettings;
