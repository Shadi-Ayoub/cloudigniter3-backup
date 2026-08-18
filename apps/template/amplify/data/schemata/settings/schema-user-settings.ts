// /**
//  * The below follows the Gen 2 pattern shown in the docs for custom identity claims (their example uses user_id, the below use sub).
//  *
//  * One small but important note about userId
//  * If we keep a userId field in the model, we should ensure it matches the caller’s sub (otherwise a user could attempt to write
//  * another user’s userId value). The owner rule will still block unauthorized reads/updates, but for create, we should either:
//  * - Option 1 (cleanest): make the record owner the sole “identity” and remove userId field from the model, and store key only
//  * (but then your identifier changes), or
//  * - Option 2 (common): keep userId, and set it server-side (or validate in a function) so it always equals the caller’s sub.
//  *
//  * The below implements option 2.
//  *
//  * Also, when calling from the client, we ensure operations use User Pool auth mode (not API key) for owner rules.
//  *
//  * Reference: https://docs.amplify.aws/react/build-a-backend/data/customize-authz/configure-custom-identity-and-group-claim
//  */

// import { a } from '@aws-amplify/backend';

// const schemaUserSettings = {
//   UserSettings: a
//     .model({
//       tenantId: a.string().required(), // "ats", "default", "global" (usually tenant scope, not global)
//       userId: a.string().required(), // Cognito sub (preferred) or stable user identifier
//       key: a.string().required(), // "preferences" | "layout" | "notifications" | ...
//       status: a.string(),
//       version: a.integer(),
//       data: a.json().required(),
//     })
//     .identifier(['tenantId', 'userId', 'key'])
//     .secondaryIndexes((index) => [
//       index('tenantId').sortKeys(['userId']).name('byUser'),
//       // Optional: list all tenants' users settings for admins or analytics
//       // index('tenantId').name('byTenant'),
//     ])
//     .authorization((allow) => [
//       // Preferred: owner-based self-access
//       // NOTE: exact owner configuration depends on your auth setup (Cognito user pools / identity claims).
//       // If your framework supports owner based rules, use it; otherwise see fallback below.
//       allow
//         .owner()
//         .identityClaim('sub')
//         .to(['create', 'read', 'update', 'delete']),

//       // Admin override
//       allow.group('system-admin').to(['create', 'read', 'update', 'delete']),

//       // Fallback (optional): if you can't do owner rules yet, enable authenticated read/write
//       // and enforce "userId === currentUser.sub" in your resolver/lambda.
//       // allow.authenticated().to(['create', 'read', 'update', 'delete']),
//     ]),
// };

// export default schemaUserSettings;
