import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  CI_AWS_RESOURCE_STUDIO_CAPABILITIES,
  ciPlanAwsDataEntities,
} from "@ci-aws/server/backend";

function bookDescriptor(overrides: Record<string, unknown> = {}) {
  return {
    id: "book",
    name: "Book",
    pluralName: "Books",
    scope: "tenant",
    description: "Manage the bookstore catalog.",
    managementPage: { path: "/dashboard/books", title: "Manage Books" },
    fields: [
      { name: "title", label: "Title", type: "String", required: true },
      { name: "price", label: "Price", type: "Float" },
    ],
    authorization: [
      {
        strategy: "groups",
        groups: ["system-admin", "system-super-admin"],
        operations: ["create", "read", "update", "delete"],
      },
    ],
    secondaryIndexes: [],
    ...overrides,
  };
}

test("publishes the installed Amplify scalar field capability catalog", () => {
  assert.deepEqual(
    CI_AWS_RESOURCE_STUDIO_CAPABILITIES.fieldTypes.map((field) => field.id),
    [
      "ID",
      "String",
      "Int",
      "Float",
      "Boolean",
      "AWSDate",
      "AWSTime",
      "AWSDateTime",
      "AWSTimestamp",
      "AWSEmail",
      "AWSJSON",
      "AWSPhone",
      "AWSURL",
      "AWSIPAddress",
    ],
  );
  assert.deepEqual(
    CI_AWS_RESOURCE_STUDIO_CAPABILITIES.generatedOperations.operations,
    ["create", "get", "list", "update", "delete"],
  );
  assert.equal(
    CI_AWS_RESOURCE_STUDIO_CAPABILITIES.generatedOperations.lambdas,
    false,
  );
  assert.equal(
    CI_AWS_RESOURCE_STUDIO_CAPABILITIES.systemFields.find(
      (field) => field.name === "createdAt",
    )?.implicit,
    true,
  );
});

test("plans a typechecked managed Book schema with CloudIgniter keys and a Query-backed list index", async () => {
  const plan = ciPlanAwsDataEntities({ descriptors: [bookDescriptor()] });
  const schema = plan.files.find((file) =>
    file.path.endsWith("schema.generated.ts"),
  );

  assert.ok(schema);
  assert.match(schema.content, /PK: a\.string\(\)\.required\(\)/);
  assert.match(schema.content, /SK: a\.string\(\)\.required\(\)/);
  assert.match(schema.content, /\.identifier\(\["PK", "SK"\]\)/);
  assert.match(schema.content, /queryField\("listBooksByScope"\)/);
  assert.match(schema.content, /title: a\.string\(\)\.required\(\)/);
  assert.doesNotMatch(schema.content, /createdAt:/);
  assert.doesNotMatch(schema.content, /updatedAt:/);
  assert.equal(plan.frontend[0]?.managementPage.path, "/dashboard/books");
  assert.equal(
    schema.content,
    await readFile(
      new URL(
        "../../../../apps/template/amplify/custom/data/schemata/__fixtures__/resource-studio-book-schema.fixture.ts",
        import.meta.url,
      ),
      "utf8",
    ),
  );
});

test("rejects reserved fields and duplicate management routes", () => {
  assert.throws(
    () =>
      ciPlanAwsDataEntities({
        descriptors: [
          bookDescriptor({ fields: [{ name: "PK", type: "String" }] }),
        ],
      }),
    /managed by CloudIgniter/,
  );

  assert.throws(
    () =>
      ciPlanAwsDataEntities({
        descriptors: [
          bookDescriptor(),
          bookDescriptor({ id: "publication", name: "Publication" }),
        ],
      }),
    /Management route .* registered more than once/,
  );
});

test("rejects dynamic or internal management paths", () => {
  for (const managementPath of [
    "/dashboard/books/[id]",
    "/dashboard/../books",
    "/Dashboard/books",
    "/ci-internal/books",
    "/api/books",
  ]) {
    assert.throws(
      () =>
        ciPlanAwsDataEntities({
          descriptors: [
            bookDescriptor({
              managementPage: { path: managementPath, title: "Books" },
            }),
          ],
        }),
      /Management page path/,
    );
  }
});

test("normalizes typed defaults before rendering Amplify fields", () => {
  const plan = ciPlanAwsDataEntities({
    descriptors: [
      bookDescriptor({
        fields: [
          {
            name: "price",
            type: "Float",
            defaultValue: "12.5",
          },
          {
            name: "featured",
            type: "Boolean",
            defaultValue: "false",
          },
        ],
      }),
    ],
  });
  const schema = plan.files.find((file) =>
    file.path.endsWith("schema.generated.ts"),
  );

  assert.ok(schema);
  assert.match(schema.content, /price: a\.float\(\)\.default\(12\.5\)/);
  assert.match(schema.content, /featured: a\.boolean\(\)\.default\(false\)/);
});

test("rejects invalid authorization providers and GSI key fields", () => {
  assert.throws(
    () =>
      ciPlanAwsDataEntities({
        descriptors: [
          bookDescriptor({
            authorization: [
              {
                strategy: "groups",
                provider: "identityPool",
                groups: ["admin"],
              },
            ],
          }),
        ],
      }),
    /does not support provider/,
  );

  assert.throws(
    () =>
      ciPlanAwsDataEntities({
        descriptors: [
          bookDescriptor({
            fields: [{ name: "published", type: "Boolean" }],
            secondaryIndexes: [
              {
                partitionKey: "published",
                name: "byPublished",
                queryField: "listBooksByPublished",
                projection: "ALL",
              },
            ],
          }),
        ],
      }),
    /key-compatible field/,
  );
});

test("keeps V1 on managed models and globally unique logical routes", () => {
  assert.throws(
    () =>
      ciPlanAwsDataEntities({
        descriptors: [
          bookDescriptor({ dataStore: { mode: "existing-table" } }),
        ],
      }),
    /managed-model/,
  );

  assert.throws(
    () =>
      ciPlanAwsDataEntities({
        descriptors: [
          bookDescriptor(),
          bookDescriptor({
            id: "global-book",
            name: "GlobalBook",
            pluralName: "GlobalBooks",
            scope: "global",
          }),
        ],
      }),
    /Management route .* registered more than once/,
  );
});
