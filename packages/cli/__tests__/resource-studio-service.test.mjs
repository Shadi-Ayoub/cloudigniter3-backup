import assert from "node:assert/strict";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  ciCreateResourceStudioService,
  ciLoadResourceStudioPlanners,
} from "../src/runtime/resource-studio/ci-resource-studio-service.mjs";

async function ciCreateApplication(t) {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "ci-resource-studio-service-"),
  );
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

async function ciExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function ciNormalizeDescriptor(value) {
  if (!value || !/^[a-z][a-z0-9-]*$/.test(value.id)) {
    throw new Error("A valid kebab-case ID is required.");
  }
  if (!/^[A-Z][A-Za-z0-9]*$/.test(value.name ?? "")) {
    throw new Error("A PascalCase name is required.");
  }
  if (!Array.isArray(value.fields) || value.fields.length === 0) {
    throw new Error("At least one field is required.");
  }
  return {
    schemaVersion: 1,
    kind: "data-entity",
    provider: "aws-amplify",
    id: value.id,
    name: value.name,
    pluralName: value.pluralName,
    scope: value.scope,
    description:
      value.description ?? `Manage ${value.pluralName.toLowerCase()}.`,
    dataStore: {
      mode: "managed-model",
      modelName: value.name,
      identifier: ["PK", "SK"],
    },
    managementPage: value.managementPage,
    fields: value.fields,
    authorization: value.authorization ?? [],
    secondaryIndexes: value.secondaryIndexes ?? [],
  };
}

function ciFakePlanners() {
  return {
    aws: {
      CI_AWS_RESOURCE_STUDIO_CAPABILITIES: {
        fieldTypes: [{ id: "String", inputKind: "string" }],
        authorizationStrategies: ["groups"],
      },
      ciNormalizeAwsDataEntityDescriptor: ciNormalizeDescriptor,
      ciPlanAwsDataEntities({ descriptors }) {
        const normalized = descriptors
          .map(ciNormalizeDescriptor)
          .sort((a, b) => a.id.localeCompare(b.id));
        const files = normalized.flatMap((descriptor) => {
          const root = `amplify/custom/data/schemata/data-entities/${descriptor.id}`;
          return [
            {
              path: `${root}/entity.ci.json`,
              content: `${JSON.stringify(descriptor, null, 2)}\n`,
              ownership: "generated",
              resourceId: descriptor.id,
            },
            {
              path: `${root}/schema.generated.ts`,
              content: `export const model = ${JSON.stringify(descriptor.name)};\n`,
              ownership: "generated",
              resourceId: descriptor.id,
            },
          ];
        });
        files.push({
          path: "amplify/custom/data/schemata/registry.generated.ts",
          content: `export const entities = ${JSON.stringify(normalized.map((item) => item.id))};\n`,
          ownership: "generated",
        });
        return {
          descriptors: normalized,
          files,
          warnings: [],
          frontend: normalized,
        };
      },
    },
    next: {
      ciPlanNextDataEntities({ entities }) {
        const files = entities.flatMap((entity) => {
          const route = entity.managementPage.path.slice(1);
          const root = `src/app/(ci-${entity.scope})/ci-${entity.scope}/(ci-custom)/${route}`;
          return [
            {
              path: `${root}/page.tsx`,
              content: `export default function Page() { return ${JSON.stringify(entity.name)}; }\n`,
              ownership: "generated",
              resourceId: entity.id,
            },
          ];
        });
        files.push({
          path: "src/custom/routes/resource-studio.generated.ts",
          content: `export const routes = ${JSON.stringify(entities.map((item) => item.managementPage.path))};\n`,
          ownership: "generated",
        });
        return { files };
      },
    },
  };
}

async function ciSeedEmptyPlan(applicationRoot, planners = ciFakePlanners()) {
  const awsPlan = planners.aws.ciPlanAwsDataEntities({ descriptors: [] });
  const nextPlan = planners.next.ciPlanNextDataEntities({
    entities: awsPlan.frontend,
  });
  for (const file of [...awsPlan.files, ...nextPlan.files]) {
    const absolutePath = path.join(applicationRoot, ...file.path.split("/"));
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, file.content);
  }
}

function ciBook(overrides = {}) {
  return {
    id: "book",
    name: "Book",
    pluralName: "Books",
    scope: "tenant",
    description: "Manage books.",
    managementPage: { path: "/dashboard/books", title: "Books" },
    fields: [
      {
        name: "title",
        label: "Title",
        type: "String",
        required: true,
        array: false,
        itemsRequired: false,
      },
    ],
    authorization: [],
    secondaryIndexes: [],
    ...overrides,
  };
}

test("creates, updates, drops, and exactly undoes Data Entity plans", async (t) => {
  const applicationRoot = await ciCreateApplication(t);
  await writeFile(
    path.join(applicationRoot, "unrelated.txt"),
    "developer work\n",
  );
  await ciSeedEmptyPlan(applicationRoot);
  const service = await ciCreateResourceStudioService({
    applicationRoot,
    loadPlanners: async () => ciFakePlanners(),
  });

  const created = await service.createEntity(ciBook());
  assert.equal(created.status, "applied");
  assert.match(created.transactionId, /^rs-create-book-/);
  const descriptorPath = path.join(
    applicationRoot,
    "amplify/custom/data/schemata/data-entities/book/entity.ci.json",
  );
  assert.equal(JSON.parse(await readFile(descriptorPath, "utf8")).name, "Book");
  assert.equal(
    await ciExists(
      path.join(
        applicationRoot,
        "src/app/(ci-tenant)/ci-tenant/(ci-custom)/dashboard/books/page.tsx",
      ),
    ),
    true,
  );

  const updated = await service.updateEntity(
    "book",
    ciBook({
      managementPage: { path: "/dashboard/catalog", title: "Catalog" },
    }),
  );
  assert.equal(updated.status, "applied");
  assert.equal(
    await ciExists(
      path.join(
        applicationRoot,
        "src/app/(ci-tenant)/ci-tenant/(ci-custom)/dashboard/books/page.tsx",
      ),
    ),
    false,
  );
  assert.equal(
    await ciExists(
      path.join(
        applicationRoot,
        "src/app/(ci-tenant)/ci-tenant/(ci-custom)/dashboard/catalog/page.tsx",
      ),
    ),
    true,
  );

  const undoneUpdate = await service.undo();
  assert.equal(undoneUpdate.status, "rolled-back");
  assert.equal(
    JSON.parse(await readFile(descriptorPath, "utf8")).managementPage.path,
    "/dashboard/books",
  );

  const dropped = await service.dropEntity("book");
  assert.equal(dropped.status, "applied");
  assert.equal(await ciExists(descriptorPath), false);
  const undoneDrop = await service.undo(dropped.transactionId);
  assert.equal(undoneDrop.status, "rolled-back");
  assert.equal(await ciExists(descriptorPath), true);
  assert.equal(
    await readFile(path.join(applicationRoot, "unrelated.txt"), "utf8"),
    "developer work\n",
  );

  const state = await service.getState();
  assert.equal(state.entities.length, 1);
  assert.equal(state.entities[0].id, "book");
  assert.ok(state.history.some((entry) => entry.operation === "drop"));
});

test("blocks generated-file drift before changing any Data Entity artifact", async (t) => {
  const applicationRoot = await ciCreateApplication(t);
  await ciSeedEmptyPlan(applicationRoot);
  const service = await ciCreateResourceStudioService({
    applicationRoot,
    loadPlanners: async () => ciFakePlanners(),
  });
  await service.createEntity(ciBook());
  const schemaPath = path.join(
    applicationRoot,
    "amplify/custom/data/schemata/data-entities/book/schema.generated.ts",
  );
  const descriptorPath = path.join(
    applicationRoot,
    "amplify/custom/data/schemata/data-entities/book/entity.ci.json",
  );
  const descriptorBefore = await readFile(descriptorPath, "utf8");
  await writeFile(schemaPath, "// developer drift\n");

  await assert.rejects(
    service.getDeploymentPlanHash(),
    (error) =>
      error.code === "CI_RESOURCE_STUDIO_GENERATED_DRIFT" &&
      error.conflicts.some((conflict) =>
        conflict.path.endsWith("schema.generated.ts"),
      ),
  );
  await assert.rejects(
    service.updateEntity("book", ciBook({ description: "Changed." })),
    (error) =>
      error.code === "CI_RESOURCE_STUDIO_GENERATED_DRIFT" &&
      error.statusCode === 409 &&
      error.conflicts.some((conflict) =>
        conflict.path.endsWith("schema.generated.ts"),
      ),
  );
  assert.equal(await readFile(descriptorPath, "utf8"), descriptorBefore);
  assert.equal(await readFile(schemaPath, "utf8"), "// developer drift\n");
});

test("hashes the exact current generated plan for deployment intents", async (t) => {
  const applicationRoot = await ciCreateApplication(t);
  await ciSeedEmptyPlan(applicationRoot);
  const service = await ciCreateResourceStudioService({
    applicationRoot,
    loadPlanners: async () => ciFakePlanners(),
  });

  const emptyHash = await service.getDeploymentPlanHash();
  assert.match(emptyHash, /^[a-f0-9]{64}$/);
  assert.equal(await service.getDeploymentPlanHash(), emptyHash);
  await service.createEntity(ciBook());
  const bookHash = await service.getDeploymentPlanHash();
  assert.match(bookHash, /^[a-f0-9]{64}$/);
  assert.notEqual(bookHash, emptyHash);
});

test("refuses to claim a newly planned path that already belongs to the application", async (t) => {
  const applicationRoot = await ciCreateApplication(t);
  await ciSeedEmptyPlan(applicationRoot);
  const collidingPage = path.join(
    applicationRoot,
    "src/app/(ci-tenant)/ci-tenant/(ci-custom)/dashboard/books/page.tsx",
  );
  await mkdir(path.dirname(collidingPage), { recursive: true });
  await writeFile(collidingPage, "export default function ExistingPage() {}\n");
  const service = await ciCreateResourceStudioService({
    applicationRoot,
    loadPlanners: async () => ciFakePlanners(),
  });

  await assert.rejects(
    service.createEntity(ciBook()),
    (error) =>
      error.code === "CI_RESOURCE_STUDIO_OWNERSHIP_COLLISION" &&
      error.conflicts.some((conflict) => conflict.path.endsWith("page.tsx")),
  );
  assert.equal(
    await readFile(collidingPage, "utf8"),
    "export default function ExistingPage() {}\n",
  );
  assert.equal(
    await ciExists(
      path.join(
        applicationRoot,
        "amplify/custom/data/schemata/data-entities/book/entity.ci.json",
      ),
    ),
    false,
  );
});

test("rejects reserved route and model collisions before preparing a transaction", async (t) => {
  const applicationRoot = await ciCreateApplication(t);
  await ciSeedEmptyPlan(applicationRoot);
  const service = await ciCreateResourceStudioService({
    applicationRoot,
    loadPlanners: async () => ciFakePlanners(),
    inspectReservations: async () => ({
      routePaths: ["/dashboard/security/*"],
      modelNames: ["Book"],
    }),
  });

  await assert.rejects(
    service.createEntity(
      ciBook({
        managementPage: {
          path: "/dashboard/security/books",
          title: "Books",
        },
      }),
    ),
    (error) =>
      error.code === "CI_RESOURCE_STUDIO_RESOURCE_COLLISION" &&
      error.statusCode === 409 &&
      error.conflicts.some(
        (conflict) => conflict.reservedBy === "/dashboard/security/*",
      ) &&
      error.conflicts.some((conflict) => conflict.modelName === "Book"),
  );
  const transactionRoot = path.join(
    applicationRoot,
    ".cloudigniter/local/resource-studio/transactions",
  );
  assert.equal(await ciExists(transactionRoot), false);
});

test("loads the required planner entry points from an application's dependencies", async (t) => {
  const applicationRoot = await ciCreateApplication(t);
  for (const [packageName, subpath, source] of [
    [
      "@cloudigniter/aws",
      "server/backend",
      "export const CI_AWS_RESOURCE_STUDIO_CAPABILITIES = {}; export const ciNormalizeAwsDataEntityDescriptor = (value) => value; export const ciPlanAwsDataEntities = () => ({ descriptors: [], files: [], frontend: [], warnings: [] });\n",
    ],
    [
      "@cloudigniter/next",
      "lib",
      "export const ciPlanNextDataEntities = () => ({ files: [] });\n",
    ],
    [
      "@cloudigniter/core",
      "lib",
      "export const ciCoreRoutes = { '/dashboard': {} };\n",
    ],
  ]) {
    const packageDirectory = path.join(
      applicationRoot,
      "node_modules",
      ...packageName.split("/"),
    );
    await mkdir(packageDirectory, { recursive: true });
    await writeFile(
      path.join(packageDirectory, "package.json"),
      `${JSON.stringify({
        name: packageName,
        type: "module",
        exports: { [`./${subpath}`]: { import: "./planner.mjs" } },
      })}\n`,
    );
    await writeFile(path.join(packageDirectory, "planner.mjs"), source);
  }

  const planners = await ciLoadResourceStudioPlanners({ applicationRoot });
  assert.equal(typeof planners.aws.ciPlanAwsDataEntities, "function");
  assert.equal(typeof planners.next.ciPlanNextDataEntities, "function");
  assert.deepEqual(Object.keys(planners.core.ciCoreRoutes), ["/dashboard"]);
});
