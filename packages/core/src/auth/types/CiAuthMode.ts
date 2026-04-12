// export type CiAuthMode = 'apiKey' | 'iam' | 'userPool' | 'identityPool' | 'oidc' | 'lambda';
/**
 * Provider-neutral auth mode placeholder.
 *
 * Concrete provider packages are expected to narrow this.
 */
export type CiAuthMode = string;
