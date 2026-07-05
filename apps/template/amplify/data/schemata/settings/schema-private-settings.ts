// import { a } from '@aws-amplify/backend';

// const schemaPrivateSettings = {
//   PrivateSettings: a
//     .model({
//       tenantId: a.string().required(),
//       key: a.string().required(),
//       status: a.string(),
//       version: a.integer(),
//       data: a.json().required(),
//     })
//     .identifier(['tenantId', 'key'])
//     .secondaryIndexes((index) => [index('tenantId').name('byTenant')])
//     .authorization((allow) => [
//       allow.group('SYSTEM_ADMIN').to(['create', 'read', 'update', 'delete']),
//       // optionally: allow.authenticated().to(['read'])  (if any logged-in user can read private settings)
//     ]),
// };

// export default schemaPrivateSettings;
