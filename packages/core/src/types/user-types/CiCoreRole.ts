/**
 * Canonical roles provided by CloudIgniter.
 *
 * Applications can add provider-specific roles without extending this union.
 */
export type CiCoreRole =
  | "USER"
  | "DEVELOPER"
  | "ADMIN"
  | "SUPER_ADMIN"
  | "SYSTEM_ADMIN"
  | "SYSTEM_SUPER_ADMIN";
