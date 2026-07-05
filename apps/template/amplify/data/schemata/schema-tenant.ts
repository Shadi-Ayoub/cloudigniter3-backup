// import { a } from '@aws-amplify/backend';

// import { getTenantHandler } from '../../functions/system/tenant/get-tenant/resource';
// import { getTenantBySlugHandler } from '../../functions/system/tenant/get-tenant-by-slug/resource';
// import { getTenantLookupBySlugHandler } from '../../functions/system/tenant/get-tenant-lookup-by-slug/resource';
// import { createTenantHandler } from '../../functions/system/tenant/create-tenant/resource';
// import { deleteTenantHandler } from '../../functions/system/tenant/delete-tenant/resource';
// import { updateTenantHandler } from '../../functions/system/tenant/update-tenant/resource';
// import { listTenantsHandler } from '../../functions/system/tenant/list-tenants/resource';
// import { seedTenantsHandler } from '../../functions/system/tenant/seed-tenants/resource';

// const schemaTenant = {
//   getTenant: a
//     .query()
//     .arguments({
//       inputString: a.string(),
//     })
//     .handler(a.handler.function(getTenantHandler))
//     .returns(a.json())
//     .authorization((allow) => [allow.publicApiKey(), allow.authenticated()]),

//   getTenantBySlug: a
//     .query()
//     .arguments({
//       inputString: a.string(),
//     })
//     .handler(a.handler.function(getTenantBySlugHandler))
//     .returns(a.json())
//     .authorization((allow) => [allow.publicApiKey(), allow.authenticated()]),

//   getTenantLookupBySlug: a
//     .query()
//     .arguments({
//       inputString: a.string(),
//     })
//     .handler(a.handler.function(getTenantLookupBySlugHandler))
//     .returns(a.json())
//     .authorization((allow) => [allow.publicApiKey(), allow.authenticated()]),

//   createTenant: a
//     .mutation()
//     .arguments({
//       inputString: a.string(),
//     })
//     .handler(a.handler.function(createTenantHandler))
//     .returns(a.json())
//     .authorization((allow) => [allow.group('SYSTEM_ADMIN')]),

//   deleteTenant: a
//     .mutation()
//     .arguments({
//       inputString: a.string(),
//     })
//     .handler(a.handler.function(deleteTenantHandler))
//     .returns(a.json())
//     .authorization((allow) => [allow.group('SYSTEM_ADMIN')]),

//   updateTenant: a
//     .mutation()
//     .arguments({
//       inputString: a.string(),
//     })
//     .handler(a.handler.function(updateTenantHandler))
//     .returns(a.json())
//     .authorization((allow) => [allow.group('SYSTEM_ADMIN')]),

//   listTenants: a
//     .query()
//     .arguments({
//       inputString: a.string(),
//     })
//     .handler(a.handler.function(listTenantsHandler))
//     .returns(a.json())
//     .authorization((allow) => [allow.group('SYSTEM_ADMIN')]),

//   seedTenants: a
//     .mutation()
//     .arguments({
//       inputString: a.string(),
//     })
//     .handler(a.handler.function(seedTenantsHandler))
//     .returns(a.json())
//     .authorization((allow) => [allow.group('DEVELOPER')]),
// };

// export default schemaTenant;
