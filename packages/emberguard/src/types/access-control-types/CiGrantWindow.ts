/** Optional activation window shared by scoped assignments and direct grants. */
export type CiGrantWindow = {
  /** ISO-8601 instant at which the grant becomes active, inclusive. */
  validFrom?: string;

  /** ISO-8601 instant at which the grant stops being active, exclusive. */
  expiresAt?: string;
};
