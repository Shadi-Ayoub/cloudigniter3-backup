// import { cookies } from 'next/headers';
// import {
//   generateServerClientUsingCookies,
//   type ClientUsingSSRCookies,
// } from '@aws-amplify/adapter-nextjs/api';

// import type {
//   CloudIgniterAmplifyOutputs,
//   CreateTenantInterface,
//   GetTenantInterface,
//   GetTenantBySlugInterface,
//   GetTenantLookupBySlugInterface,
//   UpdateTenantInterface,
//   DeleteTenantInterface,
//   CiRequest,
// } from '@cloudigniter/next/types';

// import ciConfig from '@/../cloudigniter.config';
// import outputs from '@/../amplify_outputs.json';
// import type { Schema } from '@/../amplify/data/resource';

// const config = outputs as CloudIgniterAmplifyOutputs;

// // export { ciParseGraphqlResponse } from '@cloudigniter/next/utility';
// export const dynamodbClientConfig = ciConfig.dynamodb.clientConfig;

// export const amplifyClient = generateServerClientUsingCookies<Schema>({
//   config,
//   cookies,
// }) as ClientUsingSSRCookies<Schema>;

// export function prepareGetTenantInputString(tenantId: string) {
//   const input: CiRequest<GetTenantInterface> = {
//     input: { tenantId },
//     options: {
//       DynamoDbClientConfig: dynamodbClientConfig,
//     },
//   };

//   return JSON.stringify(input);
// }

// export function prepareGetTenantBySlugInputString(slug: string) {
//   const input: CiRequest<GetTenantBySlugInterface> = {
//     input: { slug },
//     options: {
//       DynamoDbClientConfig: dynamodbClientConfig,
//     },
//   };

//   return JSON.stringify(input);
// }

// export function prepareGetTenantLookupBySlugInputString(slug: string) {
//   const input: CiRequest<GetTenantLookupBySlugInterface> = {
//     input: { slug },
//     options: {
//       DynamoDbClientConfig: dynamodbClientConfig,
//     },
//   };

//   return JSON.stringify(input);
// }

// export function prepareCreateTenantInputString(
//   tenantId: string,
//   name: string,
//   description: string,
//   slug: string,
//   meta: Record<string, unknown>
// ) {
//   const input: CiRequest<CreateTenantInterface> = {
//     input: { id: tenantId, tenantId, name, description, slug, meta },
//     options: {
//       DynamoDbClientConfig: dynamodbClientConfig,
//     },
//   };

//   return JSON.stringify(input);
// }

// export function prepareDeleteTenantInputString(tenantId: string) {
//   const input: CiRequest<DeleteTenantInterface> = {
//     input: { tenantId },
//     options: {
//       DynamoDbClientConfig: dynamodbClientConfig,
//     },
//   };

//   return JSON.stringify(input);
// }

// export function prepareUpdateTenantInputString(
//   tenantId: string,
//   name?: string,
//   description?: string,
//   slug?: string,
//   meta?: Record<string, unknown>
// ) {
//   const input: CiRequest<UpdateTenantInterface> = {
//     input: { tenantId, name, description, slug, meta },
//     options: {
//       DynamoDbClientConfig: dynamodbClientConfig,
//     },
//   };

//   return JSON.stringify(input);
// }

// // export function prepareSeedTenantsInputString(
// //   tenants: SeedTenantItem[],
// //   envMode: CiSeedEnvMode
// // ) {
// //   const envelope: CiRequest<SeedTenantsInterface> = {
// //     input: { tenants, envMode },
// //     options: {
// //       DynamoDbClientConfig: dynamodbClientConfig,
// //     },
// //   };

// //   return JSON.stringify(envelope);
// // }
