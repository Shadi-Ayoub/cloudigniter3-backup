import { a } from "@aws-amplify/backend";
import { CI_CORE_AMPLIFY_FUNCTION_RESOURCES } from "../../backend/ci-core-amplify-manifest";

const {
  cleanupSeededTenantsHandler,
  deleteTenantHandler,
  listTenantsHandler,
  purgeTenantHandler,
  restoreTenantHandler,
  seedTenantsHandler,
  setTenantStatusHandler,
} = CI_CORE_AMPLIFY_FUNCTION_RESOURCES;

const schemaTenant = {
  ListTenants: a
    .query()
    .arguments({ inputString: a.string().required() })
    .handler(a.handler.function(listTenantsHandler))
    .returns(a.json())
    .authorization((allow) => [
      allow.group("developer"),
      allow.group("system-admin"),
      allow.group("system-super-admin"),
    ]),
  SeedTenants: a
    .mutation()
    .arguments({ inputString: a.string().required() })
    .handler(a.handler.function(seedTenantsHandler))
    .returns(a.json())
    .authorization((allow) => [allow.group("developer")]),
  CleanupSeededTenants: a
    .mutation()
    .arguments({ inputString: a.string().required() })
    .handler(a.handler.function(cleanupSeededTenantsHandler))
    .returns(a.json())
    .authorization((allow) => [allow.group("developer")]),
  DeleteTenant: a
    .mutation()
    .arguments({ inputString: a.string().required() })
    .handler(a.handler.function(deleteTenantHandler))
    .returns(a.json())
    .authorization((allow) => [
      allow.group("system-admin"),
      allow.group("system-super-admin"),
    ]),
  RestoreTenant: a
    .mutation()
    .arguments({ inputString: a.string().required() })
    .handler(a.handler.function(restoreTenantHandler))
    .returns(a.json())
    .authorization((allow) => [
      allow.group("system-admin"),
      allow.group("system-super-admin"),
    ]),
  PurgeTenant: a
    .mutation()
    .arguments({ inputString: a.string().required() })
    .handler(a.handler.function(purgeTenantHandler))
    .returns(a.json())
    .authorization((allow) => [
      allow.group("system-admin"),
      allow.group("system-super-admin"),
    ]),
  SetTenantStatus: a
    .mutation()
    .arguments({ inputString: a.string().required() })
    .handler(a.handler.function(setTenantStatusHandler))
    .returns(a.json())
    .authorization((allow) => [
      allow.group("system-admin"),
      allow.group("system-super-admin"),
    ]),
};

export default schemaTenant;
