import { a } from "@aws-amplify/backend";

/** Control-plane records that share the System table security boundary. */
const schemaSystem = {
  SystemItemType: a.enum([
    "TENANT",
    "ORG_UNIT",
    "ORG_UNIT_ATTACHMENT",
    "SEED_MARKER",
  ]),
  System: a
    .model({
      PK: a.string().required(),
      SK: a.string().required(),
      GSI1PK: a.string(),
      GSI1SK: a.string(),
      GSI2PK: a.string(),
      GSI2SK: a.string(),
      id: a.string().required(),
      type: a.ref("SystemItemType").required(),
      tenantId: a.string(),
      status: a.string(),
      deletionState: a.string(),
      deletion: a.json(),
      name: a.string(),
      description: a.string(),
      data: a.json(),
      version: a.integer(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .identifier(["PK", "SK"])
    .secondaryIndexes((index) => [
      index("GSI1PK").sortKeys(["GSI1SK"]).name("GSI1"),
      index("GSI2PK").sortKeys(["GSI2SK"]).name("GSI2"),
    ])
    .authorization((allow) => [allow.group("system-super-admin")]),
};

export default schemaSystem;
