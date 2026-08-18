type CiGeneratedFile = {
  path: string;
  content: string;
  ownership: "generated";
  resourceId?: string;
};

type CiFrontendField = {
  name: string;
  label: string;
  type: string;
  required: boolean;
  array: boolean;
  itemsRequired: boolean;
  inputKind: string;
  valueKind: string;
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

type CiFrontendEntity = {
  id: string;
  name: string;
  pluralName: string;
  modelName: string;
  scope: "global" | "tenant";
  description: string;
  managementPage: { path: string; title: string };
  listQueryField: string;
  fields: CiFrontendField[];
};

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const STATIC_ROUTE =
  /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*)(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;

function assertEntity(entity: CiFrontendEntity): void {
  const identifiers: ReadonlyArray<readonly [string, string]> = [
    ["entity name", entity.name],
    ["plural name", entity.pluralName],
    ["model name", entity.modelName],
    ["list query field", entity.listQueryField],
  ];
  for (const [label, value] of identifiers) {
    if (!IDENTIFIER.test(value))
      throw new Error(`Invalid ${label} "${value}".`);
  }
  if (
    !STATIC_ROUTE.test(entity.managementPage.path) ||
    entity.managementPage.path.endsWith("/")
  ) {
    throw new Error(
      `Invalid static management route "${entity.managementPage.path}".`,
    );
  }
  if (entity.scope !== "global" && entity.scope !== "tenant") {
    throw new Error(`Unsupported management-page scope "${entity.scope}".`);
  }
}

function fieldBaseType(field: CiFrontendField): string {
  switch (field.valueKind) {
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "json":
      return "unknown";
    default:
      return "string";
  }
}

function fieldRecordType(field: CiFrontendField): string {
  const base = fieldBaseType(field);
  const item = field.itemsRequired ? base : `${base} | null`;
  const value = field.array ? `Array<${item}>` : base;
  return field.required ? value : `${value} | null`;
}

function fieldInputType(field: CiFrontendField): string {
  const base = fieldBaseType(field);
  const item = field.itemsRequired ? base : `${base} | null`;
  const value = field.array ? `Array<${item}>` : base;
  return field.required ? value : `${value} | null | undefined`;
}

function renderRecordTypes(entity: CiFrontendEntity): string {
  const recordFields = entity.fields
    .map((field) => `  ${field.name}: ${fieldRecordType(field)};`)
    .join("\n");
  const mutationFields = entity.fields
    .map(
      (field) =>
        `  ${field.name}${field.required ? "" : "?"}: ${fieldInputType(field)};`,
    )
    .join("\n");
  return `export type Ci${entity.name}Record = {\n  id: string;\n${recordFields}\n  createdAt?: string | null;\n  updatedAt?: string | null;\n};\n\nexport type Ci${entity.name}MutationInput = {\n${mutationFields}\n};\n\nexport type Ci${entity.pluralName}Page = {\n  rows: Ci${entity.name}Record[];\n  nextCursor: string | null;\n};\n\nexport type Ci${entity.name}SaveResult =\n  | { ok: true; record: Ci${entity.name}Record }\n  | { ok: false; message: string };\n\nexport type Ci${entity.name}DeleteResult =\n  | { ok: true }\n  | { ok: false; message: string };`;
}

function renderScopeResolver(entity: CiFrontendEntity): string {
  const structural = entity.name
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toUpperCase();
  if (entity.scope === "tenant") {
    return `async function ciResolve${entity.name}Scope() {
  const context = await appBootstrap();
  if (context.tenant.scope !== "tenant" || !context.tenant.id) {
    throw new Error("${entity.pluralName} management requires a resolved Tenant context.");
  }
  const tenantId = context.tenant.id;
  return {
    collectionKey: ciBuildTableKey(
      "DATA_ENTITY",
      "TENANT",
      tenantId,
      "${structural}_COLLECTION",
    ),
    recordKeys(id: string) {
      return {
        PK: ciBuildTableKey(
          "DATA_ENTITY",
          "TENANT",
          tenantId,
          "${structural}",
          id,
        ),
        SK: ciBuildTableKey("DATA_ENTITY", "${structural}", id),
        ciScopeKey: ciBuildTableKey(
          "DATA_ENTITY",
          "TENANT",
          tenantId,
          "${structural}_COLLECTION",
        ),
        ciSortKey: ciBuildTableKey("DATA_ENTITY", "${structural}", id),
      };
    },
  };
}`;
  }
  return `async function ciResolve${entity.name}Scope() {
  const context = await appBootstrap();
  if (context.tenant.scope !== "global") {
    throw new Error("${entity.pluralName} management requires the Global context.");
  }
  return {
    collectionKey: ciBuildTableKey(
      "DATA_ENTITY",
      "GLOBAL",
      "${structural}_COLLECTION",
    ),
    recordKeys(id: string) {
      return {
        PK: ciBuildTableKey(
          "DATA_ENTITY",
          "GLOBAL",
          "${structural}",
          id,
        ),
        SK: ciBuildTableKey("DATA_ENTITY", "${structural}", id),
        ciScopeKey: ciBuildTableKey(
          "DATA_ENTITY",
          "GLOBAL",
          "${structural}_COLLECTION",
        ),
        ciSortKey: ciBuildTableKey("DATA_ENTITY", "${structural}", id),
      };
    },
  };
}`;
}

function renderActions(entity: CiFrontendEntity): string {
  const typeDefinitions = renderRecordTypes(entity);
  const toRecordFields = entity.fields
    .map((field) => `    ${field.name}: value.${field.name},`)
    .join("\n");
  const mutationFields = entity.fields
    .map((field) => `      ${field.name}: input.${field.name},`)
    .join("\n");
  return `"use server";\n\nimport { randomUUID } from "node:crypto";\n\nimport {\n  ciBuildTableKey,\n  ciNormalizeThrownError,\n} from "@cloudigniter/core/lib";\n\nimport type { Schema } from "@/../amplify/data/resource";\nimport { appBootstrap, appServerClient } from "@/kernel/server";\n\n${typeDefinitions}\n\nfunction ciAssert${entity.name}Response(\n  errors: readonly { message?: string | null }[] | undefined,\n) {\n  if (!errors?.length) return;\n  throw new Error(\n    errors\n      .map((error) => error.message ?? "Amplify Data operation failed.")\n      .join("; "),\n  );\n}\n\nfunction ci${entity.name}MutationFailure(error: unknown) {\n  return {\n    ok: false as const,\n    message: ciNormalizeThrownError(error).message,\n  };\n}\n\nfunction ciTo${entity.name}Record(\n  value: Schema[${JSON.stringify(entity.modelName)}]["type"],\n): Ci${entity.name}Record {\n  return {\n    id: value.id,\n${toRecordFields}\n    createdAt: value.createdAt,\n    updatedAt: value.updatedAt,\n  };\n}\n\n${renderScopeResolver(entity)}\n\nexport async function ciList${entity.pluralName}(input: {\n  cursor?: string | null;\n  pageSize?: number;\n}): Promise<Ci${entity.pluralName}Page> {\n  const scope = await ciResolve${entity.name}Scope();\n  const pageSize = Math.max(\n    1,\n    Math.min(100, Math.trunc(input.pageSize ?? 25)),\n  );\n  const response = await appServerClient.models.${entity.modelName}.${entity.listQueryField}(\n    { ciScopeKey: scope.collectionKey },\n    { limit: pageSize, nextToken: input.cursor ?? undefined },\n  );\n  ciAssert${entity.name}Response(response.errors);\n  return {\n    rows: (response.data ?? []).map(ciTo${entity.name}Record),\n    nextCursor: response.nextToken ?? null,\n  };\n}\n\nexport async function ciGet${entity.name}(\n  id: string,\n): Promise<Ci${entity.name}Record | null> {\n  const scope = await ciResolve${entity.name}Scope();\n  const response = await appServerClient.models.${entity.modelName}.get(\n    scope.recordKeys(id),\n  );\n  ciAssert${entity.name}Response(response.errors);\n  return response.data ? ciTo${entity.name}Record(response.data) : null;\n}\n\nexport async function ciCreate${entity.name}(\n  input: Ci${entity.name}MutationInput,\n): Promise<Ci${entity.name}SaveResult> {\n  try {\n    const scope = await ciResolve${entity.name}Scope();\n    const id = randomUUID();\n    const response = await appServerClient.models.${entity.modelName}.create({\n      ...scope.recordKeys(id),\n      id,\n${mutationFields}\n    });\n    ciAssert${entity.name}Response(response.errors);\n    if (!response.data) {\n      throw new Error(\n        "Amplify Data did not return the created ${entity.name} record.",\n      );\n    }\n    return { ok: true, record: ciTo${entity.name}Record(response.data) };\n  } catch (error) {\n    return ci${entity.name}MutationFailure(error);\n  }\n}\n\nexport async function ciUpdate${entity.name}(\n  id: string,\n  input: Ci${entity.name}MutationInput,\n): Promise<Ci${entity.name}SaveResult> {\n  try {\n    const scope = await ciResolve${entity.name}Scope();\n    const response = await appServerClient.models.${entity.modelName}.update({\n      ...scope.recordKeys(id),\n${mutationFields}\n    });\n    ciAssert${entity.name}Response(response.errors);\n    if (!response.data) {\n      throw new Error(\n        "Amplify Data did not return the updated ${entity.name} record.",\n      );\n    }\n    return { ok: true, record: ciTo${entity.name}Record(response.data) };\n  } catch (error) {\n    return ci${entity.name}MutationFailure(error);\n  }\n}\n\nexport async function ciDelete${entity.name}(\n  id: string,\n): Promise<Ci${entity.name}DeleteResult> {\n  try {\n    const scope = await ciResolve${entity.name}Scope();\n    const response = await appServerClient.models.${entity.modelName}.delete(\n      scope.recordKeys(id),\n    );\n    ciAssert${entity.name}Response(response.errors);\n    return { ok: true };\n  } catch (error) {\n    return ci${entity.name}MutationFailure(error);\n  }\n}\n`;
}

function renderManagerBase(entity: CiFrontendEntity): string {
  const managerValueKind = (field: CiFrontendField) =>
    ["number", "boolean", "json"].includes(field.valueKind)
      ? field.valueKind
      : "string";
  const managerInputKind = (field: CiFrontendField) => {
    if (field.array || field.valueKind === "json") return "textarea";
    if (field.inputKind === "datetime") return "datetime-local";
    if (["email", "url", "date", "time"].includes(field.inputKind)) {
      return field.inputKind;
    }
    return "text";
  };
  const fieldDefinitions = entity.fields
    .map((field) => {
      const valueKind = managerValueKind(field);
      const properties = [
        `name: ${JSON.stringify(field.name)}`,
        `label: ${JSON.stringify(field.label)}`,
        `valueKind: ${JSON.stringify(valueKind)}`,
        `required: ${field.required}`,
        `array: ${field.array}`,
        `itemsRequired: ${field.itemsRequired}`,
      ];
      if (valueKind === "string") {
        properties.splice(
          3,
          0,
          `inputKind: ${JSON.stringify(managerInputKind(field))}`,
        );
      }
      if (Object.hasOwn(field, "defaultValue")) {
        properties.push(`defaultValue: ${JSON.stringify(field.defaultValue)}`);
      }
      if (field.valueKind === "number") {
        if (field.type === "Int" || field.type === "AWSTimestamp") {
          properties.push("step: 1");
        }
        if (field.validation?.gte !== undefined) {
          properties.push(`min: ${field.validation.gte}`);
        }
        if (field.validation?.lte !== undefined) {
          properties.push(`max: ${field.validation.lte}`);
        }
      }
      return `  {\n${properties.map((property) => `    ${property},`).join("\n")}\n  },`;
    })
    .join("\n");
  return `"use client";\n\nimport {\n  CiDataEntityManager,\n  CiDataTable,\n} from "@cloudigniter/ui/client";\nimport type {\n  CiDataEntityField,\n  CiDataTableDataSource,\n} from "@cloudigniter/ui/types";\n\nimport {\n  ciCreate${entity.name},\n  ciDelete${entity.name},\n  ciList${entity.pluralName},\n  ciUpdate${entity.name},\n  type Ci${entity.name}MutationInput,\n  type Ci${entity.name}Record,\n} from "./actions.generated";\n\nconst fields = [\n${fieldDefinitions}\n] satisfies readonly CiDataEntityField<Ci${entity.name}Record>[];\n\nconst source: CiDataTableDataSource<Ci${entity.name}Record> = {\n  async fetchPage(query, signal) {\n    if (signal?.aborted) {\n      throw new DOMException("Request aborted", "AbortError");\n    }\n    const result = await ciList${entity.pluralName}({\n      cursor: query.cursor,\n      pageSize: query.pageSize === "all" ? 100 : query.pageSize,\n    });\n    if (signal?.aborted) {\n      throw new DOMException("Request aborted", "AbortError");\n    }\n    return result;\n  },\n};\n\n/** Application-owned ${entity.pluralName} administration surface generated by Resource Studio. */\nexport function Ci${entity.pluralName}Manager() {\n  return (\n    <CiDataEntityManager<Ci${entity.name}Record>\n      title=${JSON.stringify(entity.managementPage.title)}\n      description=${JSON.stringify(entity.description)}\n      entityLabel=${JSON.stringify(entity.name)}\n      entityPluralLabel=${JSON.stringify(entity.pluralName)}\n      fields={fields}\n      source={source}\n      getRowId={(record) => record.id}\n      getRecordLabel={(record) =>\n        String(record.${entity.fields[0]?.name ?? "id"} ?? record.id)\n      }\n      onCreate={async (values) => ({\n        ok: true,\n        message: ${JSON.stringify(`${entity.name} created successfully.`)},\n        record: await ciCreate${entity.name}(\n          values as Ci${entity.name}MutationInput,\n        ),\n      })}\n      onUpdate={async (record, values) => ({\n        ok: true,\n        message: ${JSON.stringify(`${entity.name} updated successfully.`)},\n        record: await ciUpdate${entity.name}(\n          record.id,\n          values as Ci${entity.name}MutationInput,\n        ),\n      })}\n      onDelete={async (record) => {\n        await ciDelete${entity.name}(record.id);\n        return {\n          ok: true,\n          message: ${JSON.stringify(`${entity.name} deleted successfully.`)},\n        };\n      }}\n      renderTable={(props) => <CiDataTable {...props} />}\n    />\n  );\n}\n`;
}

function renderManagerMutationCallbacks(entity: CiFrontendEntity): string {
  return `      onCreate={async (values) => {
        const result = await ciCreate${entity.name}(
          values as Ci${entity.name}MutationInput,
        );
        return result.ok
          ? {
              ...result,
              message: ${JSON.stringify(`${entity.name} created successfully.`)},
            }
          : result;
      }}
      onUpdate={async (record, values) => {
        const result = await ciUpdate${entity.name}(
          record.id,
          values as Ci${entity.name}MutationInput,
        );
        return result.ok
          ? {
              ...result,
              message: ${JSON.stringify(`${entity.name} updated successfully.`)},
            }
          : result;
      }}
      onDelete={async (record) => {
        const result = await ciDelete${entity.name}(record.id);
        return result.ok
          ? {
              ...result,
              message: ${JSON.stringify(`${entity.name} deleted successfully.`)},
            }
          : result;
      }}
`;
}

function renderManager(entity: CiFrontendEntity): string {
  const base = renderManagerBase(entity);
  const callbackStart = base.indexOf("      onCreate=");
  const callbackEnd = base.indexOf("      renderTable=", callbackStart);
  if (callbackStart < 0 || callbackEnd < 0) {
    throw new Error("Resource Studio could not compose the manager callbacks.");
  }
  return `${base.slice(0, callbackStart)}${renderManagerMutationCallbacks(entity)}${base.slice(callbackEnd)}`;
}

function renderPage(entity: CiFrontendEntity): string {
  const pageName = `${entity.scope}-${entity.id}-management`;
  return `import type { Metadata } from "next";\nimport { CiPage } from "@cloudigniter/next/client";\n\nimport { appBootstrap } from "@/kernel/server";\n\nimport { Ci${entity.pluralName}Manager } from "./Ci${entity.pluralName}Manager";\n\nexport const metadata: Metadata = {\n  title: ${JSON.stringify(`${entity.managementPage.title} | CloudIgniter`)},\n  description: ${JSON.stringify(entity.description)},\n};\n\nexport default async function ${entity.pluralName}ManagementPage() {\n  const context = await appBootstrap();\n  if (context.tenant.scope !== ${JSON.stringify(entity.scope)}) {\n    throw new Error(${JSON.stringify(`This management page is available only in ${entity.scope} scope.`)});\n  }\n\n  return (\n    <CiPage\n      name=${JSON.stringify(pageName)}\n      setup={{\n        showPageHeader: true,\n        breadcrumbs: [{ label: ${JSON.stringify(entity.managementPage.title)} }],\n      }}\n      context={context}\n    >\n      <Ci${entity.pluralName}Manager />\n    </CiPage>\n  );\n}\n`;
}

function renderRoutes(entities: readonly CiFrontendEntity[]): string {
  const entries = entities
    .map(
      (entity) =>
        `  ${JSON.stringify(entity.managementPage.path)}: {\n    title: ${JSON.stringify(entity.managementPage.title)},\n    namespace: "dashboard",\n    protected: true,\n    tenantScopes: [${JSON.stringify(entity.scope)}],\n  },`,
    )
    .join("\n");
  const routeMap = entries ? `{\n${entries}\n}` : "{}";
  return `import type { CiRoutesMap } from "@cloudigniter/core/types";\n\n/** Generated by CloudIgniter Resource Studio. Do not edit directly. */\nexport const resourceStudioRoutes = ${routeMap} satisfies CiRoutesMap;\n`;
}

function routeRoot(entity: CiFrontendEntity): string {
  const logicalPath = entity.managementPage.path.slice(1);
  return `src/app/(ci-${entity.scope})/ci-${entity.scope}/(ci-custom)/${logicalPath}`;
}

export function ciPlanNextDataEntities(input: {
  entities: readonly CiFrontendEntity[];
}): { files: CiGeneratedFile[] } {
  const entities = [...input.entities].sort((left, right) =>
    left.id.localeCompare(right.id),
  );
  entities.forEach(assertEntity);
  const files: CiGeneratedFile[] = entities.flatMap((entity) => {
    const root = routeRoot(entity);
    return [
      {
        path: `${root}/page.tsx`,
        content: renderPage(entity),
        ownership: "generated" as const,
        resourceId: entity.id,
      },
      {
        path: `${root}/Ci${entity.pluralName}Manager.tsx`,
        content: renderManager(entity),
        ownership: "generated" as const,
        resourceId: entity.id,
      },
      {
        path: `${root}/actions.generated.ts`,
        content: renderActions(entity),
        ownership: "generated" as const,
        resourceId: entity.id,
      },
    ];
  });
  files.push({
    path: "src/custom/routes/resource-studio.generated.ts",
    content: renderRoutes(entities),
    ownership: "generated",
  });
  return { files };
}
