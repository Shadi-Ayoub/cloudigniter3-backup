import { a } from "@aws-amplify/backend";

/** Storage-only model. All access passes through the guarded settings operations. */
export default {
  PrivateSettings: a
    .model({
      PK: a.string().required(),
      SK: a.string().required(),
      settingsId: a.string().required(),
      scope: a.string().required(),
      targetTenantScope: a.string().required(),
      tenantId: a.string(),
      userId: a.string(),
      enforcement: a.json(),
      value: a.json().required(),
      revision: a.integer().required(),
    })
    .identifier(["PK", "SK"])
    .authorization((allow) => [allow.group("system-super-admin")])
    .disableOperations(["queries", "mutations", "subscriptions"]),
};
