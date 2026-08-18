import { a } from "@aws-amplify/backend";

import { CI_CORE_AMPLIFY_FUNCTION_RESOURCES } from "../../backend/ci-core-amplify-manifest";

const {
  deleteEmberguardCustomDomainHandler,
  deleteEmberguardRoleAssignmentHandler,
  getEmberguardDefinitionHandler,
  listEmberguardCustomDomainsHandler,
  listEmberguardResourceInventoryHandler,
  listEmberguardRoleAssignmentsHandler,
  putEmberguardCustomDomainHandler,
  putEmberguardResourceInventoryHandler,
  putEmberguardRoleAssignmentHandler,
  setEmberguardDefinitionHandler,
} = CI_CORE_AMPLIFY_FUNCTION_RESOURCES;

const schemaEmberguard = {
  EmberguardAccessItemType: a.enum([
    "ACCESS_DEFINITION",
    "ACCESS_DOMAIN",
    "ACCESS_RESOURCE",
    "RESOURCE_INVENTORY",
    "ROLE_ASSIGNMENT",
    "CUSTOM_DOMAIN",
    "AUDIT_EVENT",
  ]),

  EmberguardAccess: a
    .model({
      PK: a.string().required(),
      SK: a.string().required(),
      GSI1PK: a.string(),
      GSI1SK: a.string(),
      type: a.ref("EmberguardAccessItemType").required(),
      tenantId: a.string(),
      subjectId: a.string(),
      roleId: a.string(),
      domainId: a.string(),
      resourceId: a.string(),
      status: a.string(),
      payload: a.json(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      expiresAt: a.datetime(),
    })
    .identifier(["PK", "SK"])
    .secondaryIndexes((index) => [
      index("GSI1PK").sortKeys(["GSI1SK"]).name("GSI1"),
    ])
    // Direct model access bypasses the custom-handler policy checks below, so
    // only the super administrator may use generated model operations.
    .authorization((allow) => [allow.group("system-super-admin")]),

  GetEmberguardDefinition: a
    .query()
    .arguments({ inputString: a.string() })
    .handler(a.handler.function(getEmberguardDefinitionHandler))
    .returns(a.json())
    .authorization((allow) => [
      allow.group("system-admin"),
      allow.group("system-super-admin"),
    ]),

  SetEmberguardDefinition: a
    .mutation()
    .arguments({ inputString: a.string().required() })
    .handler(a.handler.function(setEmberguardDefinitionHandler))
    .returns(a.json())
    .authorization((allow) => [
      allow.group("system-admin"),
      allow.group("system-super-admin"),
    ]),

  ListEmberguardRoleAssignments: a
    .query()
    .arguments({ inputString: a.string() })
    .handler(a.handler.function(listEmberguardRoleAssignmentsHandler))
    .returns(a.json())
    .authorization((allow) => [
      allow.group("system-admin"),
      allow.group("system-super-admin"),
    ]),

  PutEmberguardRoleAssignment: a
    .mutation()
    .arguments({ inputString: a.string().required() })
    .handler(a.handler.function(putEmberguardRoleAssignmentHandler))
    .returns(a.json())
    .authorization((allow) => [
      allow.group("system-admin"),
      allow.group("system-super-admin"),
    ]),

  DeleteEmberguardRoleAssignment: a
    .mutation()
    .arguments({ inputString: a.string().required() })
    .handler(a.handler.function(deleteEmberguardRoleAssignmentHandler))
    .returns(a.json())
    .authorization((allow) => [
      allow.group("system-admin"),
      allow.group("system-super-admin"),
    ]),

  ListEmberguardResourceInventory: a
    .query()
    .arguments({ inputString: a.string() })
    .handler(a.handler.function(listEmberguardResourceInventoryHandler))
    .returns(a.json())
    .authorization((allow) => [
      allow.group("system-admin"),
      allow.group("system-super-admin"),
    ]),

  PutEmberguardResourceInventory: a
    .mutation()
    .arguments({ inputString: a.string().required() })
    .handler(a.handler.function(putEmberguardResourceInventoryHandler))
    .returns(a.json())
    .authorization((allow) => [
      allow.group("system-admin"),
      allow.group("system-super-admin"),
    ]),

  ListEmberguardCustomDomains: a
    .query()
    .arguments({ inputString: a.string() })
    .handler(a.handler.function(listEmberguardCustomDomainsHandler))
    .returns(a.json())
    .authorization((allow) => [
      allow.group("system-admin"),
      allow.group("system-super-admin"),
    ]),

  PutEmberguardCustomDomain: a
    .mutation()
    .arguments({ inputString: a.string().required() })
    .handler(a.handler.function(putEmberguardCustomDomainHandler))
    .returns(a.json())
    .authorization((allow) => [
      allow.group("system-admin"),
      allow.group("system-super-admin"),
    ]),

  DeleteEmberguardCustomDomain: a
    .mutation()
    .arguments({ inputString: a.string().required() })
    .handler(a.handler.function(deleteEmberguardCustomDomainHandler))
    .returns(a.json())
    .authorization((allow) => [
      allow.group("system-admin"),
      allow.group("system-super-admin"),
    ]),
};

export default schemaEmberguard;
