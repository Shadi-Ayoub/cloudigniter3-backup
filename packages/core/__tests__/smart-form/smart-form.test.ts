import assert from "node:assert/strict";
import test from "node:test";
import {
  ciCompileSmartForm,
  ciDefineSmartForm,
  ciGenerateSmartFormModule,
  ciIsSmartFormFieldVisible,
  ciMapSmartFormData,
  ciMergeSmartFormSpecifications,
  ciMergeSmartFormTemplates,
  ciSmartFormInitialValues,
} from "../../src/lib/smart-form/ci-smart-form";
import { ciGeneratedSmartForms } from "../../src/lib/smart-form/ci-core-forms.generated";
import {
  CI_USER_CREATE_FORM_SPEC,
  CI_USER_FORM_TEMPLATE,
} from "../../src/lib/smart-form/ci-user-form-definitions";
import type { CiSmartFormSpec, CiSmartFormTemplate } from "../../src/types";

const core: CiSmartFormSpec = {
  id: "profile",
  fields: [{ name: "email", required: true, props: { autoComplete: "email" } }],
  buttons: [{ id: "save", label: "Save", type: "save" }],
};

test("merges by name/id, preserves inputs and property bags, and supports explicit removal", () => {
  const before = JSON.stringify(core);
  const merged = ciMergeSmartFormSpecifications(core, {
    fields: [
      {
        name: "email",
        label: "Contact",
        props: { placeholder: "you@example.com" },
      },
      { name: "department", group: "employment" },
    ],
    groups: [{ name: "employment", label: "Employment" }],
    buttons: [{ id: "save", label: "Update profile" }],
  });
  assert.equal(merged.fields.length, 2);
  assert.deepEqual(merged.fields[0]?.props, {
    autoComplete: "email",
    placeholder: "you@example.com",
  });
  assert.equal(merged.fields[0]?.required, true);
  assert.equal(merged.buttons?.[0]?.type, "save");
  assert.equal(JSON.stringify(core), before);
  assert.equal(
    ciMergeSmartFormSpecifications(merged, {
      fields: [{ name: "department", remove: true }],
    }).fields.length,
    1,
  );
});

test("fixed specifications ignore even malformed custom overrides", () => {
  const fixed = { ...core, category: "fixed" as const };
  assert.deepEqual(
    ciMergeSmartFormSpecifications(fixed, {
      fields: [{ name: "bad-name" }],
      groups: [{ name: "main", remove: true }],
    }),
    fixed,
  );
});

test("reserves main while allowing fields to use its implicit default", () => {
  assert.throws(
    () =>
      ciMergeSmartFormSpecifications(core, {
        groups: [{ name: "main", label: "Override" }],
      }),
    /reserved/,
  );
  const compiled = ciCompileSmartForm({
    ...core,
    groups: [{ name: "last", order: -100 }],
  });
  assert.equal(compiled.template.groups[0]?.name, "main");
  assert.deepEqual(compiled.template.groups[0]?.rows[0]?.fields, ["email"]);
});

test("rejects invalid, duplicate, and prototype-sensitive field names", () => {
  for (const name of [
    "1first",
    "first_name",
    "first name",
    "a.b",
    "a-b",
    "__proto__",
    "constructor",
    "prototype",
  ]) {
    assert.throws(
      () => ciCompileSmartForm({ id: "test", fields: [{ name }] }),
      /Invalid/,
    );
  }
  assert.throws(
    () =>
      ciCompileSmartForm({
        id: "test",
        fields: [{ name: "email" }, { name: "email" }],
      }),
    /Duplicate/,
  );
  assert.throws(
    () =>
      ciCompileSmartForm({
        id: "test",
        fields: [{ name: "email", group: "missing" }],
      }),
    /Unknown group/,
  );
});

test("templates merge rows by id, replace explicit field placement, and append unmapped fields", () => {
  const template: CiSmartFormTemplate = {
    groups: [{ name: "main", rows: [{ id: "contact", fields: ["email"] }] }],
  };
  const extended = ciMergeSmartFormTemplates(template, {
    groups: [
      {
        name: "main",
        rows: [{ id: "contact", fields: ["email", "givenName"], columns: 2 }],
      },
    ],
  });
  const spec = ciMergeSmartFormSpecifications(core, {
    fields: [{ name: "givenName" }, { name: "familyName" }],
  });
  const compiled = ciCompileSmartForm(spec, extended);
  assert.deepEqual(
    compiled.template.groups[0]?.rows.map((row) => row.fields),
    [["email", "givenName"], ["familyName"]],
  );
  assert.deepEqual(template.groups[0]?.rows[0]?.fields, ["email"]);
  assert.throws(
    () => ciCompileSmartForm(core, extended),
    /Unknown template field/,
  );
  assert.throws(
    () =>
      ciCompileSmartForm(core, {
        groups: [
          { name: "main", rows: [{ id: "a", fields: ["email", "email"] }] },
        ],
      }),
    /Duplicate template field/,
  );
});

test("template grouping and row identities cannot silently hide layout errors", () => {
  assert.throws(
    () =>
      ciCompileSmartForm(
        { ...core, groups: [{ name: "work" }] },
        { groups: [{ name: "work", rows: [{ id: "a", fields: ["email"] }] }] },
      ),
    /belongs to group/,
  );
  assert.throws(
    () =>
      ciMergeSmartFormTemplates(
        { groups: [] },
        { groups: [{ name: "main", remove: true }] },
      ),
    /cannot be removed/,
  );
  assert.throws(
    () =>
      ciCompileSmartForm(core, {
        groups: [
          {
            name: "main",
            rows: [
              { id: "same", fields: [] },
              { id: "same", fields: [] },
            ],
          },
        ],
      }),
    /Duplicate row/,
  );
});

test("maps nested API records, preserves falsy values, supports transforms, and omits absent paths", () => {
  const mapped = ciMapSmartFormData(
    {
      profile: { enabled: false, score: 0, empty: "", cleared: null },
      given: "Ada",
    },
    {
      enabled: "profile.enabled",
      score: "profile.score",
      empty: "profile.empty",
      cleared: "profile.cleared",
      missing: "profile.missing",
      fallback: { path: "profile.missing", defaultValue: "default" },
      displayName: (source) => `${source.given} Lovelace`,
    },
  );
  assert.deepEqual(mapped, {
    enabled: false,
    score: 0,
    empty: "",
    cleared: null,
    fallback: "default",
    displayName: "Ada Lovelace",
  });
  assert.throws(
    () => ciMapSmartFormData({}, { name: "constructor.prototype.x" }),
    /Unsafe/,
  );
  assert.deepEqual(
    ciMapSmartFormData(Object.create({ inherited: "secret" }), {
      name: "inherited",
    }),
    {},
  );
});

test("identity caching shares frozen plans and isolates changed definitions and default values", () => {
  const spec: CiSmartFormSpec = {
    id: "choices",
    fields: [
      { name: "choices", type: { kind: "multiSelect" }, defaultValue: [] },
    ],
  };
  const a = ciDefineSmartForm(spec);
  assert.strictEqual(a, ciDefineSmartForm(spec));
  assert.notStrictEqual(a, ciDefineSmartForm({ ...spec, title: "Changed" }));
  assert.equal(Object.isFrozen(a.specifications.fields[0]), true);
  const first = ciSmartFormInitialValues(spec);
  const second = ciSmartFormInitialValues(spec);
  assert.notStrictEqual(first.choices, second.choices);
  assert.deepEqual(
    ciSmartFormInitialValues<Record<string, unknown>>({
      id: "binary",
      fields: [
        {
          name: "active",
          type: { kind: "boolean", falseOption: { value: "N", label: "No" } },
        },
      ],
    }),
    { active: "N" },
  );
});

test("generated artifacts match current sources and contain no runtime data", () => {
  assert.equal(
    Object.isFrozen(ciGeneratedSmartForms.userCreate.specifications.fields[0]),
    true,
  );
  assert.deepEqual(
    ciGeneratedSmartForms.userCreate,
    ciCompileSmartForm(CI_USER_CREATE_FORM_SPEC, CI_USER_FORM_TEMPLATE),
  );
  const module = ciGenerateSmartFormModule({
    profile: ciCompileSmartForm(core),
  });
  assert.match(module, /CiCompiledSmartForm/);
  assert.doesNotMatch(module, /ciCompileSmartForm\(/);
  assert.throws(
    () => ciGenerateSmartFormModule({ "bad-key": ciCompileSmartForm(core) }),
    /Invalid/,
  );
  assert.throws(
    () =>
      ciCompileSmartForm({
        ...core,
        fields: [{ name: "email", props: { onClick: "run" } }],
      }),
    /managed prop/,
  );
  assert.throws(
    () =>
      ciCompileSmartForm(
        JSON.parse(
          '{"id":"unsafe","fields":[{"name":"email","props":{"__proto__":{}}}]}',
        ),
      ),
    /Unsafe/,
  );
});

test("conditions compare false and zero without truthiness coercion", () => {
  assert.equal(
    ciIsSmartFormFieldVisible(
      { name: "details", visibleWhen: { field: "enabled", equals: false } },
      { details: "", enabled: false },
    ),
    true,
  );
  assert.equal(
    ciIsSmartFormFieldVisible(
      { name: "details", visibleWhen: { field: "count", notEquals: 0 } },
      { details: "", count: 0 },
    ),
    false,
  );
});

test("JSON input rejects missing field names and incompatible choice displays", () => {
  assert.throws(
    () => ciCompileSmartForm(JSON.parse('{"id":"invalid","fields":[{}]}')),
    /Invalid field name/,
  );
  assert.throws(
    () =>
      ciCompileSmartForm(
        JSON.parse(
          '{"id":"invalid","fields":[{"name":"tags","type":{"kind":"multiSelect","display":"slider"}}]}',
        ),
      ),
    /Invalid field display/,
  );
});
