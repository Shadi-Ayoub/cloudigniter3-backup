import type {
  CiAuthConfig,
  CiDevConfig,
  CiI18nConfig,
  CiRoute,
  CiRouteRuntimeConfig,
  CiTenantRoutingOptions,
  CiThemeConfig,
  // CiTraceConfig,
} from "@ci-core/types";

import type { CiDataConfig } from "./CiDataConfig";

/**
 * CloudIgniter framework-level config.
 *
 * TPlatformConfig:
 * Provider/platform-specific configuration such as AWS, Azure, or GCP.
 *
 * TAppConfig:
 * Application-specific extension config supplied by the end user.
 */
// export type CiCoreConfig<
//   TPlatformConfig extends Record<string, unknown> = Record<string, never>,
//   TAppConfig extends Record<string, unknown> = Record<string, never>,
// > = {
export type CiCoreConfig = {
  auth: CiAuthConfig;

  data: CiDataConfig;

  // traceLog: CiTraceConfig;

  route?: CiRouteRuntimeConfig;

  i18n: CiI18nConfig;

  theme: CiThemeConfig;

  tenant: CiTenantRoutingOptions;

  routes: Record<string, CiRoute>;

  dev: CiDevConfig;

  // platform?: TPlatformConfig;

  // app?: TAppConfig;
};

// import type { CognitoIdentityProviderClientConfig } from '@aws-sdk/client-cognito-identity-provider';
// import type { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';

// import type { CiAuthenticatorConfig, CiInfoPageStrategy } from '../';

// import type {
//   CiI18nConfig,
//   CiPublicAuthMode,
//   CiRoute,
//   CiTenantRoutingOptions,
//   CiThemeConfig,
//   CiTraceConfig,
// } from '../';

// // Type for cloudigniter.config.ts
// export type CiConfig = {
//   loginRoute?: string;
//   data: {
//     publicAuthMode: CiPublicAuthMode;
//   };
//   authenticator: CiAuthenticatorConfig;
//   traceLog: CiTraceConfig;
//   route?: {
//     namespaceCookieName: string;
//     namespaceHeaderName: string;
//     pathnameCookieName?: string;
//     pathnameHeaderName?: string;
//     infoPageStrategy?: CiInfoPageStrategy;
//   };
//   cognito: { client: CognitoIdentityProviderClientConfig };
//   dynamodb: { clientConfig: DynamoDBClientConfig };
//   i18n: CiI18nConfig;
//   theme: CiThemeConfig;
//   tenant: CiTenantRoutingOptions;
//   routes: Record<string, CiRoute>;
//   // Later add a generic type so end user can extend the configurations for her application.
// };
