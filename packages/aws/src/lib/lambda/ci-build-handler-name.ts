/**
 * Builds a standardized CloudIgniter Lambda handler name.
 *
 * Normalization rules:
 *
 * - converts kebab-case, camelCase, snake_case, or spaced text
 * - replaces separators with `_`
 * - removes invalid characters
 * - converts to UPPER_CASE
 * - ensures `_HANDLER` suffix exists exactly once
 *
 * Examples:
 *
 * ciBuildHandlerName('cognito-create-user')
 * → COGNITO_CREATE_USER_HANDLER
 *
 * ciBuildHandlerName('createTenant')
 * → CREATE_TENANT_HANDLER
 *
 * ciBuildHandlerName('LIST_TENANTS_HANDLER')
 * → LIST_TENANTS_HANDLER
 *
 * ciBuildHandlerName(' seed tenants ')
 * → SEED_TENANTS_HANDLER
 */
export function ciBuildHandlerName(name: string): string {
  if (!name || typeof name !== 'string') {
    throw new Error('ciBuildHandlerName: name must be a non-empty string');
  }

  const normalized = name
    .trim()

    // convert camelCase → camel_Case
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')

    // replace separators
    .replace(/[-\s]+/g, '_')

    // remove illegal characters
    .replace(/[^\w]/g, '_')

    // collapse multiple underscores
    .replace(/_+/g, '_')

    // trim underscores
    .replace(/^_+|_+$/g, '')

    .toUpperCase();

  if (normalized.endsWith('_HANDLER')) {
    return normalized;
  }

  return `${normalized}_HANDLER`;
}
