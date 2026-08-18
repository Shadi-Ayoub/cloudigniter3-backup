import assert from "node:assert/strict";
import test from "node:test";

import { ciPlanNextDataEntities } from "@ci-next/lib";

const book = {
  id: "book",
  name: "Book",
  pluralName: "Books",
  modelName: "Book",
  scope: "tenant" as const,
  description: "Manage books.",
  managementPage: { path: "/dashboard/books", title: "Manage Books" },
  listQueryField: "listBooksByScope",
  fields: [
    {
      name: "title",
      label: "Title",
      type: "String",
      required: true,
      array: false,
      itemsRequired: false,
      inputKind: "string",
      valueKind: "string",
    },
  ],
};

test("plans a tenant-scoped custom route and a direct CiDataTable manager", () => {
  const plan = ciPlanNextDataEntities({ entities: [book] });
  const page = plan.files.find((file) => file.path.endsWith("/page.tsx"));
  const manager = plan.files.find((file) =>
    file.path.endsWith("/CiBooksManager.tsx"),
  );
  const actions = plan.files.find((file) =>
    file.path.endsWith("/actions.generated.ts"),
  );

  assert.ok(page);
  assert.ok(manager);
  assert.ok(actions);
  assert.equal(
    page.path,
    "src/app/(ci-tenant)/ci-tenant/(ci-custom)/dashboard/books/page.tsx",
  );
  assert.match(manager.content, /<CiDataTable \{\.\.\.props\} \/>/);
  assert.match(manager.content, /CiDataEntityManager<CiBookRecord>/);
  assert.match(manager.content, /return result\.ok/);
  assert.match(actions.content, /listBooksByScope/);
  assert.match(
    actions.content,
    /ciBuildTableKey\(\s*"DATA_ENTITY",\s*"TENANT"/,
  );
  assert.match(actions.content, /ciNormalizeThrownError/);
  assert.doesNotMatch(actions.content, /\.list\(/);
});

test("registers logical routes with an enforced tenant scope", () => {
  const plan = ciPlanNextDataEntities({ entities: [book] });
  const routes = plan.files.find((file) =>
    file.path.endsWith("resource-studio.generated.ts"),
  );

  assert.ok(routes);
  assert.match(routes.content, /"\/dashboard\/books"/);
  assert.match(routes.content, /tenantScopes: \["tenant"\]/);
  assert.doesNotMatch(routes.content, /ci-tenant\/dashboard/);
});

test("rejects route segments that could escape the generated custom tree", () => {
  assert.throws(
    () =>
      ciPlanNextDataEntities({
        entities: [
          {
            ...book,
            managementPage: {
              ...book.managementPage,
              path: "/dashboard/../books",
            },
          },
        ],
      }),
    /Invalid static management route/,
  );
});
