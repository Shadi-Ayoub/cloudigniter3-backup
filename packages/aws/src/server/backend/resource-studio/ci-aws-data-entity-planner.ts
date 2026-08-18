const FIELD_TYPES = [
  ["ID", "id", "string"],
  ["String", "string", "string"],
  ["Int", "integer", "number"],
  ["Float", "float", "number"],
  ["Boolean", "boolean", "boolean"],
  ["AWSDate", "date", "date"],
  ["AWSTime", "time", "time"],
  ["AWSDateTime", "datetime", "datetime"],
  ["AWSTimestamp", "timestamp", "number"],
  ["AWSEmail", "email", "email"],
  ["AWSJSON", "json", "json"],
  ["AWSPhone", "phone", "tel"],
  ["AWSURL", "url", "url"],
  ["AWSIPAddress", "ipAddress", "string"],
] as const;

const FIELD_TYPE_BY_NAME = new Map(
  FIELD_TYPES.map(([type, builder, inputKind]) => [
    type,
    { type, builder, inputKind },
  ]),
);

const AUTH_OPERATIONS = ["create", "read", "update", "delete"] as const;
const RESERVED_FIELDS = new Set([
  "PK",
  "SK",
  "id",
  "ciScopeKey",
  "ciSortKey",
  "createdAt",
  "updatedAt",
]);
const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const PASCAL_IDENTIFIER = /^[A-Z][A-Za-z0-9]*$/;
const RESOURCE_ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

type JsonRecord = Record<string, unknown>;

export type CiResourceStudioGeneratedFile = {
  path: string;
  content: string;
  ownership: "generated";
  resourceId?: string;
};

export type CiAwsDataEntityField = {
  name: string;
  label: string;
  type: (typeof FIELD_TYPES)[number][0];
  required: boolean;
  array: boolean;
  itemsRequired: boolean;
  defaultValue?: unknown;
  validation?: {
    minLength?: number;
    maxLength?: number;
    startsWith?: string;
    endsWith?: string;
    matches?: string;
    gt?: number;
    gte?: number;
    lt?: number;
    lte?: number;
  };
};

export type CiAwsDataEntityAuthorizationRule = {
  strategy:
    | "authenticated"
    | "guest"
    | "publicApiKey"
    | "owner"
    | "ownerDefinedIn"
    | "ownersDefinedIn"
    | "group"
    | "groups"
    | "groupDefinedIn"
    | "groupsDefinedIn"
    | "custom";
  provider?: "userPools" | "identityPool" | "oidc" | "function";
  field?: string;
  groups?: string[];
  operations: Array<(typeof AUTH_OPERATIONS)[number]>;
  identityClaim?: string;
  groupClaim?: string;
};

export type CiAwsDataEntitySecondaryIndex = {
  partitionKey: string;
  sortKeys: string[];
  name: string;
  queryField: string;
  projection: "KEYS_ONLY" | "INCLUDE" | "ALL";
  nonKeyAttributes: string[];
};

export type CiAwsDataEntityDescriptor = {
  schemaVersion: 1;
  kind: "data-entity";
  provider: "aws-amplify";
  id: string;
  name: string;
  pluralName: string;
  scope: "global" | "tenant";
  description: string;
  dataStore: {
    mode: "managed-model";
    modelName: string;
    identifier: readonly ["PK", "SK"];
  };
  managementPage: {
    path: string;
    title: string;
  };
  fields: CiAwsDataEntityField[];
  authorization: CiAwsDataEntityAuthorizationRule[];
  secondaryIndexes: CiAwsDataEntitySecondaryIndex[];
};

export type CiAwsDataEntityFrontendPlan = {
  id: string;
  name: string;
  pluralName: string;
  modelName: string;
  scope: "global" | "tenant";
  description: string;
  managementPage: { path: string; title: string };
  listQueryField: string;
  fields: Array<
    CiAwsDataEntityField & {
      inputKind: string;
      valueKind: "string" | "number" | "boolean" | "json";
    }
  >;
};

export const CI_AWS_RESOURCE_STUDIO_CAPABILITIES = Object.freeze({
  schemaVersion: 1,
  provider: "aws-amplify",
  scopes: ["tenant", "global"],
  systemFields: [
    { name: "PK", type: "String", required: true },
    { name: "SK", type: "String", required: true },
    { name: "id", type: "ID", required: true },
    { name: "ciScopeKey", type: "String", required: true },
    { name: "ciSortKey", type: "String", required: true },
    { name: "createdAt", type: "AWSDateTime", required: true, implicit: true },
    { name: "updatedAt", type: "AWSDateTime", required: true, implicit: true },
  ],
  generatedOperations: {
    implementation: "amplify-model-client",
    operations: ["create", "get", "list", "update", "delete"],
    lambdas: false,
  },
  dataStores: [
    {
      id: "managed-model",
      label: "New Amplify managed table",
      available: true,
      description:
        "Creates one Amplify a.model and its managed DynamoDB table. Existing or externally managed tables are not supported in V1.",
    },
    {
      id: "existing-table",
      label: "Existing table",
      available: false,
      description:
        "Planned for a later provider adapter because Amplify models cannot be attached safely to an arbitrary existing table by schema spread alone.",
    },
  ],
  fieldTypes: FIELD_TYPES.map(([id, builder, inputKind]) => ({
    id,
    builder,
    inputKind,
  })),
  fieldModifiers: [
    "required",
    "array",
    "arrayItemsRequired",
    "default",
    "validation",
  ],
  validationRules: {
    String: ["minLength", "maxLength", "startsWith", "endsWith", "matches"],
    Int: ["gt", "gte", "lt", "lte"],
    Float: ["gt", "gte", "lt", "lte"],
  },
  authorizationStrategies: [
    "authenticated",
    "guest",
    "publicApiKey",
    "owner",
    "ownerDefinedIn",
    "ownersDefinedIn",
    "group",
    "groups",
    "groupDefinedIn",
    "groupsDefinedIn",
    "custom",
  ],
  authorizationRules: [
    {
      id: "authenticated",
      providers: ["userPools", "identityPool", "oidc"],
    },
    { id: "guest", providers: [] },
    { id: "publicApiKey", providers: [] },
    {
      id: "owner",
      providers: ["userPools", "oidc"],
      identityClaim: true,
    },
    {
      id: "ownerDefinedIn",
      providers: ["userPools", "oidc"],
      field: "scalar-string",
      identityClaim: true,
    },
    {
      id: "ownersDefinedIn",
      providers: ["userPools", "oidc"],
      field: "string-array",
      identityClaim: true,
    },
    {
      id: "group",
      providers: ["userPools", "oidc"],
      groups: "one",
      groupClaim: true,
    },
    {
      id: "groups",
      providers: ["userPools", "oidc"],
      groups: "one-or-more",
      groupClaim: true,
    },
    {
      id: "groupDefinedIn",
      providers: ["userPools", "oidc"],
      field: "scalar-string",
      groupClaim: true,
    },
    {
      id: "groupsDefinedIn",
      providers: ["userPools", "oidc"],
      field: "string-array",
      groupClaim: true,
    },
    { id: "custom", providers: ["function"] },
  ],
  authorizationOperations: AUTH_OPERATIONS,
  groupSuggestions: [
    "system-super-admin",
    "system-admin",
    "super-admin",
    "admin",
    "developer",
    "user",
  ],
  secondaryIndexes: {
    projections: ["KEYS_ONLY", "INCLUDE", "ALL"],
    maximumCustomIndexes: 19,
    managedListIndex: true,
  },
});

function asRecord(value: unknown, label: string): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  return value as JsonRecord;
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} is required.`);
  }
  return value.trim();
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== ""
    ? value.trim()
    : undefined;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => requiredString(entry, "Array entry"));
}

function assertIdentifier(value: string, label: string): void {
  if (!IDENTIFIER.test(value)) {
    throw new Error(`${label} must be a valid GraphQL/TypeScript identifier.`);
  }
}

function assertStaticManagementPath(value: string): void {
  if (
    !/^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*)(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/.test(
      value,
    )
  ) {
    throw new Error(
      "Management page path must be a static lowercase kebab-case path such as /dashboard/books.",
    );
  }

  const reserved = ["/api", "/ci-internal", "/ci-global", "/ci-tenant"];
  if (
    reserved.some(
      (prefix) => value === prefix || value.startsWith(`${prefix}/`),
    )
  ) {
    throw new Error(
      `Management page path cannot use the reserved prefix in "${value}".`,
    );
  }
}

function normalizeValidation(
  value: unknown,
  type: string,
  array: boolean,
): CiAwsDataEntityField["validation"] | undefined {
  if (value === undefined || value === null) return undefined;
  if (array)
    throw new Error(
      "Amplify scalar validation is not available for array fields in Resource Studio V1.",
    );
  const input = asRecord(value, "Field validation");
  const output: NonNullable<CiAwsDataEntityField["validation"]> = {};
  const stringRules = [
    "minLength",
    "maxLength",
    "startsWith",
    "endsWith",
    "matches",
  ] as const;
  const numberRules = ["gt", "gte", "lt", "lte"] as const;

  for (const key of stringRules) {
    if (input[key] === undefined || input[key] === "") continue;
    if (type !== "String")
      throw new Error(`${key} validation is supported only for String fields.`);
    if (key === "minLength" || key === "maxLength") {
      const number = Number(input[key]);
      if (!Number.isSafeInteger(number) || number < 0) {
        throw new Error(`${key} must be a non-negative integer.`);
      }
      output[key] = number as never;
    } else {
      output[key] = requiredString(input[key], key) as never;
    }
  }

  for (const key of numberRules) {
    if (input[key] === undefined || input[key] === "") continue;
    if (type !== "Int" && type !== "Float") {
      throw new Error(
        `${key} validation is supported only for Int and Float fields.`,
      );
    }
    const number = Number(input[key]);
    if (!Number.isFinite(number))
      throw new Error(`${key} must be a finite number.`);
    output[key] = number;
  }

  return Object.keys(output).length > 0 ? output : undefined;
}

function normalizeField(value: unknown, index: number): CiAwsDataEntityField {
  const input = asRecord(value, `Field ${index + 1}`);
  const name = requiredString(input.name, `Field ${index + 1} name`);
  assertIdentifier(name, `Field "${name}"`);
  if (RESERVED_FIELDS.has(name)) {
    throw new Error(
      `Field "${name}" is managed by CloudIgniter and cannot be declared manually.`,
    );
  }
  const type = requiredString(input.type, `Field "${name}" type`);
  if (!FIELD_TYPE_BY_NAME.has(type as CiAwsDataEntityField["type"])) {
    throw new Error(
      `Field "${name}" uses unsupported AWS ModelFieldType "${type}".`,
    );
  }
  const array = input.array === true;
  const field: CiAwsDataEntityField = {
    name,
    label:
      optionalString(input.label) ??
      name.replace(/([a-z0-9])([A-Z])/g, "$1 $2"),
    type: type as CiAwsDataEntityField["type"],
    required: input.required === true,
    array,
    itemsRequired: array && input.itemsRequired === true,
  };
  if (Object.hasOwn(input, "defaultValue") && input.defaultValue !== "") {
    field.defaultValue = normalizeDefaultValue(input.defaultValue, field);
  }
  field.validation = normalizeValidation(input.validation, type, array);
  return field;
}

function normalizeDefaultValue(
  value: unknown,
  field: Pick<CiAwsDataEntityField, "name" | "type" | "array">,
): unknown {
  if (field.array) {
    const parsed =
      typeof value === "string"
        ? (() => {
            try {
              return JSON.parse(value) as unknown;
            } catch {
              throw new Error(
                `Default value for array field "${field.name}" must be a JSON array.`,
              );
            }
          })()
        : value;
    if (!Array.isArray(parsed)) {
      throw new Error(
        `Default value for array field "${field.name}" must be a JSON array.`,
      );
    }
    return parsed.map((entry) =>
      normalizeDefaultValue(entry, { ...field, array: false }),
    );
  }

  switch (field.type) {
    case "Int":
    case "AWSTimestamp": {
      const number = typeof value === "number" ? value : Number(value);
      if (!Number.isSafeInteger(number)) {
        throw new Error(
          `Default value for field "${field.name}" must be an integer.`,
        );
      }
      return number;
    }
    case "Float": {
      const number = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(number)) {
        throw new Error(
          `Default value for field "${field.name}" must be a finite number.`,
        );
      }
      return number;
    }
    case "Boolean":
      if (value === true || value === false) return value;
      if (value === "true") return true;
      if (value === "false") return false;
      throw new Error(
        `Default value for field "${field.name}" must be true or false.`,
      );
    case "AWSJSON":
      if (typeof value !== "string") return value;
      try {
        return JSON.parse(value) as unknown;
      } catch {
        throw new Error(
          `Default value for field "${field.name}" must be valid JSON.`,
        );
      }
    default:
      if (typeof value !== "string") {
        throw new Error(
          `Default value for field "${field.name}" must be a string.`,
        );
      }
      return value;
  }
}

function normalizeAuthorizationRule(
  value: unknown,
  index: number,
): CiAwsDataEntityAuthorizationRule {
  const input = asRecord(value, `Authorization rule ${index + 1}`);
  const strategy = requiredString(
    input.strategy,
    `Authorization rule ${index + 1} strategy`,
  );
  if (
    !CI_AWS_RESOURCE_STUDIO_CAPABILITIES.authorizationStrategies.includes(
      strategy as never,
    )
  ) {
    throw new Error(
      `Unsupported Amplify authorization strategy "${strategy}".`,
    );
  }
  const operations = stringArray(input.operations);
  if (new Set(operations).size !== operations.length) {
    throw new Error(`Authorization rule ${index + 1} repeats an operation.`);
  }
  for (const operation of operations) {
    if (!AUTH_OPERATIONS.includes(operation as never)) {
      throw new Error(`Unsupported authorization operation "${operation}".`);
    }
  }
  const rule: CiAwsDataEntityAuthorizationRule = {
    strategy: strategy as CiAwsDataEntityAuthorizationRule["strategy"],
    operations: (operations.length > 0
      ? operations
      : [...AUTH_OPERATIONS]) as CiAwsDataEntityAuthorizationRule["operations"],
  };
  const provider = optionalString(input.provider);
  if (provider) {
    if (!["userPools", "identityPool", "oidc", "function"].includes(provider)) {
      throw new Error(
        `Unsupported Amplify authorization provider "${provider}".`,
      );
    }
    rule.provider = provider as CiAwsDataEntityAuthorizationRule["provider"];
  }
  const field = optionalString(input.field);
  if (field) rule.field = field;
  const groups = stringArray(input.groups);
  if (groups.length > 0) rule.groups = groups;
  const identityClaim = optionalString(input.identityClaim);
  if (identityClaim) rule.identityClaim = identityClaim;
  const groupClaim = optionalString(input.groupClaim);
  if (groupClaim) rule.groupClaim = groupClaim;
  return rule;
}

function normalizeSecondaryIndex(
  value: unknown,
  index: number,
): CiAwsDataEntitySecondaryIndex {
  const input = asRecord(value, `Secondary index ${index + 1}`);
  const partitionKey = requiredString(
    input.partitionKey,
    `Secondary index ${index + 1} partition key`,
  );
  const name = requiredString(input.name, `Secondary index ${index + 1} name`);
  const queryField = requiredString(
    input.queryField,
    `Secondary index ${index + 1} query field`,
  );
  assertIdentifier(partitionKey, "Secondary-index partition key");
  assertIdentifier(name, "Secondary-index name");
  assertIdentifier(queryField, "Secondary-index query field");
  const projection = optionalString(input.projection) ?? "ALL";
  if (!["KEYS_ONLY", "INCLUDE", "ALL"].includes(projection)) {
    throw new Error(`Unsupported secondary-index projection "${projection}".`);
  }
  const nonKeyAttributes = stringArray(input.nonKeyAttributes);
  if (projection === "INCLUDE" && nonKeyAttributes.length === 0) {
    throw new Error(`Secondary index "${name}" requires included attributes.`);
  }
  if (projection !== "INCLUDE" && nonKeyAttributes.length > 0) {
    throw new Error(
      `Secondary index "${name}" accepts included attributes only with INCLUDE projection.`,
    );
  }
  if (new Set(nonKeyAttributes).size !== nonKeyAttributes.length) {
    throw new Error(`Secondary index "${name}" repeats an included attribute.`);
  }
  return {
    partitionKey,
    sortKeys: stringArray(input.sortKeys),
    name,
    queryField,
    projection: projection as CiAwsDataEntitySecondaryIndex["projection"],
    nonKeyAttributes: projection === "INCLUDE" ? nonKeyAttributes : [],
  };
}

function validateAuthorizationFields(
  rules: readonly CiAwsDataEntityAuthorizationRule[],
  fields: readonly CiAwsDataEntityField[],
): void {
  const byName = new Map(fields.map((field) => [field.name, field]));
  for (const rule of rules) {
    const providerSets: Record<
      CiAwsDataEntityAuthorizationRule["strategy"],
      readonly CiAwsDataEntityAuthorizationRule["provider"][]
    > = {
      authenticated: ["userPools", "identityPool", "oidc"],
      guest: [],
      publicApiKey: [],
      owner: ["userPools", "oidc"],
      ownerDefinedIn: ["userPools", "oidc"],
      ownersDefinedIn: ["userPools", "oidc"],
      group: ["userPools", "oidc"],
      groups: ["userPools", "oidc"],
      groupDefinedIn: ["userPools", "oidc"],
      groupsDefinedIn: ["userPools", "oidc"],
      custom: ["function"],
    };
    if (rule.provider && !providerSets[rule.strategy].includes(rule.provider)) {
      throw new Error(
        `${rule.strategy} authorization does not support provider "${rule.provider}".`,
      );
    }
    const fieldStrategies = [
      "ownerDefinedIn",
      "ownersDefinedIn",
      "groupDefinedIn",
      "groupsDefinedIn",
    ];
    if (rule.field && !fieldStrategies.includes(rule.strategy)) {
      throw new Error(
        `${rule.strategy} authorization does not accept a model field.`,
      );
    }
    if (["ownerDefinedIn", "groupDefinedIn"].includes(rule.strategy)) {
      const field = rule.field ? byName.get(rule.field) : undefined;
      if (!field || field.type !== "String" || field.array) {
        throw new Error(`${rule.strategy} requires a scalar String field.`);
      }
    }
    if (["ownersDefinedIn", "groupsDefinedIn"].includes(rule.strategy)) {
      const field = rule.field ? byName.get(rule.field) : undefined;
      if (!field || field.type !== "String" || !field.array) {
        throw new Error(`${rule.strategy} requires a String array field.`);
      }
    }
    if (rule.strategy === "group" && rule.groups?.length !== 1) {
      throw new Error("group authorization requires exactly one group.");
    }
    if (rule.strategy === "groups" && !rule.groups?.length) {
      throw new Error(
        `${rule.strategy} authorization requires at least one group.`,
      );
    }
    if (
      rule.groups?.length &&
      rule.strategy !== "group" &&
      rule.strategy !== "groups"
    ) {
      throw new Error(
        `${rule.strategy} authorization does not accept static groups.`,
      );
    }
    const isOwnerRule = ["owner", "ownerDefinedIn", "ownersDefinedIn"].includes(
      rule.strategy,
    );
    const isGroupRule = [
      "group",
      "groups",
      "groupDefinedIn",
      "groupsDefinedIn",
    ].includes(rule.strategy);
    if (rule.identityClaim && !isOwnerRule) {
      throw new Error(
        `identityClaim is available only for owner authorization rules.`,
      );
    }
    if (rule.groupClaim && !isGroupRule) {
      throw new Error(
        `groupClaim is available only for group authorization rules.`,
      );
    }
  }
}

function validateSecondaryIndexes(
  indexes: readonly CiAwsDataEntitySecondaryIndex[],
  fields: readonly CiAwsDataEntityField[],
  listQueryField: string,
): void {
  if (indexes.length > 19)
    throw new Error(
      "A Data Entity may define at most 19 custom GSIs; CloudIgniter reserves one GSI for bounded list queries.",
    );
  const fieldByName = new Map<
    string,
    Pick<CiAwsDataEntityField, "type" | "array">
  >([
    ["PK", { type: "String", array: false }],
    ["SK", { type: "String", array: false }],
    ["id", { type: "ID", array: false }],
    ["ciScopeKey", { type: "String", array: false }],
    ["ciSortKey", { type: "String", array: false }],
    ...fields.map((field) => [field.name, field] as const),
  ]);
  const fieldNames = new Set(fieldByName.keys());
  const indexKeyTypes = new Set([
    "ID",
    "String",
    "Int",
    "Float",
    "AWSDate",
    "AWSTime",
    "AWSDateTime",
    "AWSTimestamp",
    "AWSEmail",
    "AWSPhone",
    "AWSURL",
    "AWSIPAddress",
  ]);
  const names = new Set(["byScope"]);
  const queryFields = new Set([listQueryField]);
  for (const index of indexes) {
    if (names.has(index.name))
      throw new Error(
        `Duplicate or reserved secondary-index name "${index.name}".`,
      );
    if (queryFields.has(index.queryField))
      throw new Error(
        `Duplicate or reserved query field "${index.queryField}".`,
      );
    names.add(index.name);
    queryFields.add(index.queryField);
    const keyFields = [index.partitionKey, ...index.sortKeys];
    if (new Set(keyFields).size !== keyFields.length) {
      throw new Error(
        `Secondary index "${index.name}" repeats a partition or sort key.`,
      );
    }
    for (const field of [
      index.partitionKey,
      ...index.sortKeys,
      ...index.nonKeyAttributes,
    ]) {
      if (!fieldNames.has(field))
        throw new Error(
          `Secondary index "${index.name}" references unknown field "${field}".`,
        );
    }
    for (const fieldName of keyFields) {
      const field = fieldByName.get(fieldName);
      if (!field || field.array || !indexKeyTypes.has(field.type)) {
        throw new Error(
          `Secondary index "${index.name}" key field "${fieldName}" must be a scalar DynamoDB key-compatible field.`,
        );
      }
    }
    const keyFieldNames = new Set(["PK", "SK", ...keyFields]);
    for (const fieldName of index.nonKeyAttributes) {
      if (keyFieldNames.has(fieldName)) {
        throw new Error(
          `Secondary index "${index.name}" cannot project key field "${fieldName}" as a non-key attribute.`,
        );
      }
    }
  }
}

export function ciNormalizeAwsDataEntityDescriptor(
  value: unknown,
): CiAwsDataEntityDescriptor {
  const input = asRecord(value, "Data Entity");
  if (input.schemaVersion !== undefined && input.schemaVersion !== 1) {
    throw new Error("Data Entity schemaVersion must be 1.");
  }
  if (input.kind !== undefined && input.kind !== "data-entity") {
    throw new Error('Data Entity kind must be "data-entity".');
  }
  if (input.provider !== undefined && input.provider !== "aws-amplify") {
    throw new Error('Data Entity provider must be "aws-amplify".');
  }
  if (input.dataStore !== undefined) {
    const dataStore = asRecord(input.dataStore, "Data Store");
    if (dataStore.mode !== "managed-model") {
      throw new Error(
        'Resource Studio V1 supports only the "managed-model" Data Store mode.',
      );
    }
  }
  const name = requiredString(input.name, "Data Entity name");
  if (!PASCAL_IDENTIFIER.test(name)) {
    throw new Error(
      "Data Entity name must be a PascalCase identifier such as Book.",
    );
  }
  if (input.dataStore !== undefined) {
    const dataStore = asRecord(input.dataStore, "Data Store");
    if (dataStore.modelName !== undefined && dataStore.modelName !== name) {
      throw new Error(
        "Data Store modelName must match the Data Entity name in V1.",
      );
    }
    if (
      dataStore.identifier !== undefined &&
      (!Array.isArray(dataStore.identifier) ||
        dataStore.identifier.length !== 2 ||
        dataStore.identifier[0] !== "PK" ||
        dataStore.identifier[1] !== "SK")
    ) {
      throw new Error('Data Store identifier must be ["PK", "SK"].');
    }
  }
  const id = requiredString(input.id, "Data Entity ID");
  if (!RESOURCE_ID.test(id))
    throw new Error("Data Entity ID must use lowercase kebab-case.");
  const pluralName = requiredString(
    input.pluralName,
    "Data Entity plural name",
  );
  if (!PASCAL_IDENTIFIER.test(pluralName)) {
    throw new Error(
      "Plural name must be a PascalCase identifier such as Books.",
    );
  }
  const scope = requiredString(input.scope, "Tenant scope");
  if (scope !== "tenant" && scope !== "global") {
    throw new Error("Tenant scope must be tenant or global.");
  }
  const managementPageInput = asRecord(input.managementPage, "Management page");
  const managementPath = requiredString(
    managementPageInput.path,
    "Management page path",
  );
  assertStaticManagementPath(managementPath);
  const fieldsInput = Array.isArray(input.fields) ? input.fields : [];
  if (fieldsInput.length === 0)
    throw new Error("A Data Entity requires at least one custom field.");
  const fields = fieldsInput.map(normalizeField);
  const duplicateField = fields.find(
    (field, index) =>
      fields.findIndex((candidate) => candidate.name === field.name) !== index,
  );
  if (duplicateField)
    throw new Error(
      `Field "${duplicateField.name}" is declared more than once.`,
    );
  const authorization = (
    Array.isArray(input.authorization) ? input.authorization : []
  ).map(normalizeAuthorizationRule);
  const effectiveAuthorization =
    authorization.length > 0
      ? authorization
      : [
          {
            strategy: "groups" as const,
            groups: ["system-admin", "system-super-admin"],
            operations: [...AUTH_OPERATIONS],
          },
        ];
  validateAuthorizationFields(effectiveAuthorization, fields);
  const secondaryIndexes = (
    Array.isArray(input.secondaryIndexes) ? input.secondaryIndexes : []
  ).map(normalizeSecondaryIndex);
  const listQueryField = `list${pluralName}ByScope`;
  validateSecondaryIndexes(secondaryIndexes, fields, listQueryField);

  return {
    schemaVersion: 1,
    kind: "data-entity",
    provider: "aws-amplify",
    id,
    name,
    pluralName,
    scope,
    description:
      optionalString(input.description) ??
      `Manage ${pluralName.toLowerCase()}.`,
    dataStore: {
      mode: "managed-model",
      modelName: name,
      identifier: ["PK", "SK"],
    },
    managementPage: {
      path: managementPath,
      title:
        optionalString(managementPageInput.title) ?? `Manage ${pluralName}`,
    },
    fields,
    authorization: effectiveAuthorization,
    secondaryIndexes,
  };
}

function renderValidation(
  validation: CiAwsDataEntityField["validation"],
): string {
  if (!validation) return "";
  const calls = Object.entries(validation).map(
    ([name, value]) => `v.${name}(${JSON.stringify(value)})`,
  );
  return `.validate((v) => { ${calls.join("; ")}; })`;
}

function renderField(field: CiAwsDataEntityField): string {
  const capability = FIELD_TYPE_BY_NAME.get(field.type)!;
  let expression = `a.${capability.builder}()`;
  if (field.array && field.itemsRequired) expression += ".required()";
  if (field.array) expression += ".array()";
  if (field.required) expression += ".required()";
  if (Object.hasOwn(field, "defaultValue")) {
    expression += `.default(${JSON.stringify(field.defaultValue)})`;
  }
  expression += renderValidation(field.validation);
  return expression;
}

function renderAuthorizationRule(
  rule: CiAwsDataEntityAuthorizationRule,
): string {
  const provider = rule.provider ? `, ${JSON.stringify(rule.provider)}` : "";
  let expression: string;
  switch (rule.strategy) {
    case "authenticated":
      expression = `allow\n        .authenticated(${rule.provider ? JSON.stringify(rule.provider) : ""})`;
      break;
    case "guest":
    case "publicApiKey":
      expression = `allow\n        .${rule.strategy}()`;
      break;
    case "owner":
      expression = `allow\n        .owner(${rule.provider ? JSON.stringify(rule.provider) : ""})`;
      if (rule.identityClaim)
        expression += `.identityClaim(${JSON.stringify(rule.identityClaim)})`;
      break;
    case "ownerDefinedIn":
    case "ownersDefinedIn":
      expression = `allow\n        .${rule.strategy}(${JSON.stringify(rule.field)}${provider})`;
      if (rule.identityClaim)
        expression += `.identityClaim(${JSON.stringify(rule.identityClaim)})`;
      break;
    case "group":
      expression = `allow\n        .group(${JSON.stringify(rule.groups?.[0])}${provider})`;
      if (rule.groupClaim)
        expression += `.withClaimIn(${JSON.stringify(rule.groupClaim)})`;
      break;
    case "groups":
      expression = `allow\n        .groups([${(rule.groups ?? [])
        .map((group) => JSON.stringify(group))
        .join(", ")}]${provider})`;
      if (rule.groupClaim)
        expression += `.withClaimIn(${JSON.stringify(rule.groupClaim)})`;
      break;
    case "groupDefinedIn":
    case "groupsDefinedIn":
      expression = `allow\n        .${rule.strategy}(${JSON.stringify(rule.field)}${provider})`;
      if (rule.groupClaim)
        expression += `.withClaimIn(${JSON.stringify(rule.groupClaim)})`;
      break;
    case "custom":
      expression = `allow\n        .custom(${rule.provider ? JSON.stringify(rule.provider) : ""})`;
      break;
  }
  return `${expression}\n        .to([${rule.operations
    .map((operation) => JSON.stringify(operation))
    .join(", ")}])`;
}

function renderIndex(index: CiAwsDataEntitySecondaryIndex): string {
  let expression = `index(${JSON.stringify(index.partitionKey)})`;
  if (index.sortKeys.length > 0)
    expression += `\n        .sortKeys(${JSON.stringify(index.sortKeys)})`;
  expression += `\n        .name(${JSON.stringify(index.name)})`;
  expression += `\n        .queryField(${JSON.stringify(index.queryField)})`;
  expression +=
    index.projection === "INCLUDE"
      ? `\n        .projection("INCLUDE", ${JSON.stringify(index.nonKeyAttributes)})`
      : `\n        .projection(${JSON.stringify(index.projection)})`;
  return expression;
}

function renderSchema(descriptor: CiAwsDataEntityDescriptor): string {
  const listQueryField = `list${descriptor.pluralName}ByScope`;
  const fields = [
    "      PK: a.string().required(),",
    "      SK: a.string().required(),",
    "      id: a.id().required(),",
    "      ciScopeKey: a.string().required(),",
    "      ciSortKey: a.string().required(),",
    ...descriptor.fields.map(
      (field) => `      ${field.name}: ${renderField(field)},`,
    ),
  ].join("\n");
  const indexes = [
    `index("ciScopeKey")\n        .sortKeys(["ciSortKey"])\n        .name("byScope")\n        .queryField(${JSON.stringify(listQueryField)})\n        .projection("ALL")`,
    ...descriptor.secondaryIndexes.map(renderIndex),
  ]
    .map((index) => `      ${index},`)
    .join("\n");
  const authorization = descriptor.authorization
    .map((rule) => `      ${renderAuthorizationRule(rule)},`)
    .join("\n");

  return `import { a } from "@aws-amplify/backend";\n\n/** Generated by CloudIgniter Resource Studio. Do not edit directly. */\nconst ${descriptor.name}DataEntitySchema = {\n  ${descriptor.dataStore.modelName}: a\n    .model({\n${fields}\n    })\n    .identifier(["PK", "SK"])\n    .secondaryIndexes((index) => [\n${indexes}\n    ])\n    .authorization((allow) => [\n${authorization}\n    ]),\n};\n\nexport default ${descriptor.name}DataEntitySchema;\n`;
}

function renderRegistry(
  descriptors: readonly CiAwsDataEntityDescriptor[],
): string {
  const imports = descriptors
    .map(
      (descriptor) =>
        `import ${descriptor.name}DataEntitySchema from "./data-entities/${descriptor.id}/schema.generated";`,
    )
    .join("\n");
  const fragments = descriptors
    .map((descriptor) => `  ${descriptor.name}DataEntitySchema,`)
    .join("\n");
  const composition =
    descriptors.length === 0
      ? "ciMergeAmplifyDataSchemas({})"
      : `ciMergeAmplifyDataSchemas(\n  {},\n${fragments}\n)`;
  return `import { ciMergeAmplifyDataSchemas } from "@cloudigniter/aws/server/backend";\n${imports ? `\n${imports}\n` : ""}\n/** Generated by CloudIgniter Resource Studio. Do not edit directly. */\nconst generatedDataEntitySchemas = ${composition};\n\nexport default generatedDataEntitySchemas;\n`;
}

export function ciPlanAwsDataEntities(input: {
  descriptors: readonly unknown[];
}): {
  descriptors: CiAwsDataEntityDescriptor[];
  files: CiResourceStudioGeneratedFile[];
  frontend: CiAwsDataEntityFrontendPlan[];
  warnings: string[];
} {
  const descriptors = input.descriptors.map(ciNormalizeAwsDataEntityDescriptor);
  descriptors.sort((left, right) => left.id.localeCompare(right.id));
  for (const descriptor of descriptors) {
    const duplicateId =
      descriptors.filter((candidate) => candidate.id === descriptor.id).length >
      1;
    const duplicateModel =
      descriptors.filter(
        (candidate) =>
          candidate.dataStore.modelName === descriptor.dataStore.modelName,
      ).length > 1;
    const duplicateRoute =
      descriptors.filter(
        (candidate) =>
          candidate.managementPage.path === descriptor.managementPage.path,
      ).length > 1;
    const duplicateListQuery =
      descriptors.filter(
        (candidate) => candidate.pluralName === descriptor.pluralName,
      ).length > 1;
    if (duplicateId)
      throw new Error(
        `Data Entity ID "${descriptor.id}" is registered more than once.`,
      );
    if (duplicateModel)
      throw new Error(
        `Amplify model "${descriptor.dataStore.modelName}" is registered more than once.`,
      );
    if (duplicateRoute)
      throw new Error(
        `Management route "${descriptor.managementPage.path}" is registered more than once.`,
      );
    if (duplicateListQuery)
      throw new Error(
        `Amplify list query "list${descriptor.pluralName}ByScope" is registered more than once.`,
      );
  }

  const files: CiResourceStudioGeneratedFile[] = descriptors.flatMap(
    (descriptor) => {
      const root = `amplify/custom/data/schemata/data-entities/${descriptor.id}`;
      return [
        {
          path: `${root}/entity.ci.json`,
          content: `${JSON.stringify(descriptor, null, 2)}\n`,
          ownership: "generated" as const,
          resourceId: descriptor.id,
        },
        {
          path: `${root}/schema.generated.ts`,
          content: renderSchema(descriptor),
          ownership: "generated" as const,
          resourceId: descriptor.id,
        },
      ];
    },
  );
  files.push({
    path: "amplify/custom/data/schemata/registry.generated.ts",
    content: renderRegistry(descriptors),
    ownership: "generated",
  });

  const warnings: string[] = [];
  if (
    descriptors.some((descriptor) => descriptor.secondaryIndexes.length > 0)
  ) {
    warnings.push(
      "Amplify sandbox GSI changes can replace a managed DynamoDB table. Treat sandbox data as disposable and review the deployment plan before applying index changes.",
    );
  }
  if (
    descriptors.some((descriptor) =>
      descriptor.authorization.some(
        (rule) => rule.strategy === "publicApiKey" || rule.strategy === "guest",
      ),
    )
  ) {
    warnings.push(
      "Public or guest authorization exposes the selected operations outside signed-in user sessions. Review this access before deployment.",
    );
  }
  if (
    descriptors.some((descriptor) =>
      descriptor.authorization.some((rule) => rule.strategy === "custom"),
    )
  ) {
    warnings.push(
      "Custom authorization requires an application-managed Amplify Lambda authorizer. Resource Studio V1 does not generate that authorizer.",
    );
  }

  return {
    descriptors,
    files,
    frontend: descriptors.map((descriptor) => ({
      id: descriptor.id,
      name: descriptor.name,
      pluralName: descriptor.pluralName,
      modelName: descriptor.dataStore.modelName,
      scope: descriptor.scope,
      description: descriptor.description,
      managementPage: descriptor.managementPage,
      listQueryField: `list${descriptor.pluralName}ByScope`,
      fields: descriptor.fields.map((field) => ({
        ...field,
        inputKind: FIELD_TYPE_BY_NAME.get(field.type)!.inputKind,
        valueKind:
          field.type === "Int" ||
          field.type === "Float" ||
          field.type === "AWSTimestamp"
            ? "number"
            : field.type === "Boolean"
              ? "boolean"
              : field.type === "AWSJSON"
                ? "json"
                : "string",
      })),
    })),
    warnings,
  };
}
