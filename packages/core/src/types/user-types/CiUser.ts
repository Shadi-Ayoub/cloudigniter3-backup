export type CiUser = {
  id: string | null;
  authenticated: boolean;

  /** All roles or groups assigned to the user. */
  roles: string[];

  /**
   * Highest-precedence role resolved from {@link roles}, or `null` when none
   * of the assigned roles have a configured precedence.
   */
  primaryRole: string | null;

  /** Email address associated with the authenticated user. */
  email?: string | null;

  /** Whether the identity provider has verified the user's email address. */
  emailVerified?: boolean | null;

  /** Human-readable name resolved from the identity provider. */
  displayName?: string | null;

  /** Provider-specific username for the authenticated user. */
  username?: string | null;

  /** Identifier used to establish the current sign-in session. */
  signInId?: string | null;

  /** Provider-specific authentication flow used for the session. */
  authFlow?: string | null;

  /** ISO-8601 expiration time reported by the current session. */
  sessionExpiresAt?: string | null;

  /** Raw access token. Only expose this value to trusted diagnostic surfaces. */
  accessToken?: string | null;

  /** Raw ID token. Only expose this value to trusted diagnostic surfaces. */
  idToken?: string | null;
};
