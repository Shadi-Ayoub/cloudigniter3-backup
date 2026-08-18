/**
 * Canonical roles provided by CloudIgniter.
 *
 * Applications can add provider-specific roles without extending this union.
 */
export type CiCoreRole =
  | "user"
  | "developer"
  | "admin"
  | "super-admin"
  | "system-admin"
  | "system-super-admin";
