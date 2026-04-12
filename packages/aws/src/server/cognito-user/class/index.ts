/**
 * REMEMBER: interfaces/Types in TypeScript don't actually exist at runtime. They are only used for type
 * checking during development. Thus, when you import * as cognito, it only includes runtime values
 * (like functions or objects) and not types or interfaces.
 */
// export type { CognitoIdentityProviderClientConfig } from '@aws-sdk/client-cognito-identity-provider';
export { Cognito } from './Cognito';
