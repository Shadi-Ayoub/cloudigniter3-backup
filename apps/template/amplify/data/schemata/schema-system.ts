// import { a } from '@aws-amplify/backend';

// import { getLambdaParametersHandler } from '../../functions/system/get-lambda-parameters/resource';

// const schemaSystem = {
//   GetLambdaParameters: a
//     .query()
//     .arguments({})
//     .handler(a.handler.function(getLambdaParametersHandler))
//     .returns(a.json())
//     .authorization((allow) => [allow.group('DEVELOPER')]),
//   // System: a
//   //   .model({
//   //     id: a.id().required(),
//   //     data: a.string().required(),
//   //   })
//   //   .identifier(['id']) // Not the default auto-generated id
//   //   .authorization((allow) => [allow.group('SYSTEM_ADMIN')]),

//   /**
//    * Single-table design:
//    * - Primary key:  (PK, SK)
//    * - Optional GSIs: (GSI1PK, GSI1SK) and (GSI2PK, GSI2SK)
//    *
//    * Collections encoded by prefixed keys (examples below).
//    */
//   SystemItemType: a.enum([
//     'SETTING', // app/system settings
//     'ROLE', // role metadata
//     'PERM', // permission catalog entry
//     'ROLE_PERM', // role→permission mapping
//     'USER_ROLE', // user→role assignment (per tenant)
//     'POLICY_VER', // policy version per tenant
//     'SCOPES', // materialized role→scopes for fast reads
//     'TENANT',
//     'ORG_UNIT',
//   ]),
//   System: a
//     .model({
//       // PRIMARY KEYS
//       PK: a.string().required(), // e.g., "ROLE#role:admin", "USER#userA#default", "POLICY#default", "PERM"
//       SK: a.string().required(), // e.g., "META", "PERM#student:read", "SCOPES#*", "VER"

//       // OPTIONAL GSIs (add them if you need the extra query paths)
//       // GSI1: list users by role per tenant
//       GSI1PK: a.string(), // e.g., "ROLE#role:teacher#default"
//       GSI1SK: a.string(), // e.g., "USER#userB"
//       // GSI2: list roles that contain a given permission
//       GSI2PK: a.string(), // e.g., "PERM#student:read"
//       GSI2SK: a.string(), // e.g., "ROLE#role:admin#*"

//       // COMMON ATTRIBUTES
//       id: a.string(),
//       type: a.ref('SystemItemType').required(),
//       tenantId: a.string(), // e.g., "default", "ats", or "*" (global)
//       status: a.string(),

//       // Handy denormalized fields (optional, but great for admin UIs)
//       name: a.string(), // role/setting display name
//       description: a.string(),
//       resource: a.string(), // e.g., "student", "settings"
//       action: a.string(), // e.g., "read", "write"
//       scope: a.string(), // e.g., "student:read"
//       userId: a.string(), // for USER_ROLE items
//       roleId: a.string(), // for ROLE, ROLE_PERM, USER_ROLE items

//       // Arbitrary payload (AWSJSON)
//       data: a.json(), // store setting objects, etc.
//     })
//     .identifier(['PK', 'SK']) // composite primary key
//     // If your Amplify version supports defining GSIs here, uncomment the block below.
//     // Otherwise, add the GSIs in `amplify/backend.ts` via CDK (recommended).
//     .secondaryIndexes((index) => [
//       // “Users by Role per Tenant”
//       index('GSI1PK').sortKeys(['GSI1SK']).name('GSI1'),

//       // “Roles by Permission”
//       index('GSI2PK').sortKeys(['GSI2SK']).name('GSI2'),
//     ])
//     .authorization((allow) => [
//       allow.group('SYSTEM_ADMIN'), // full CRUD by platform/system admins
//       // optionally allow read-only for other groups:
//       // allow.group('ADMIN').to(['read']),
//     ]),
// };

// export default schemaSystem;
