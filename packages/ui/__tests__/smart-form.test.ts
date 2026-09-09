import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { createElement, type ReactNode } from "react";
import { Formik } from "formik";
import { ciDefineSmartForm } from "@cloudigniter/core/lib";
import type {
  CiSmartFormSpec,
  CiSmartFormValues,
} from "@cloudigniter/core/types";
import { CiSmartForm } from "../src/client/components/smart-form/CiSmartForm";
import { CiSmartFormField } from "../src/client/components/smart-form/components/CiSmartFormField";
import { ciValidateSmartForm } from "../src/lib/smart-form/ci-validate-smart-form";

const require = createRequire(import.meta.url);
const { renderToStaticMarkup } = require("react-dom/server") as {
  renderToStaticMarkup(node: ReactNode): string;
};

test("renders deterministic accessible form layouts, ordering, defaults, and side labels", () => {
  const spec: CiSmartFormSpec = {
    id: "test",
    title: "Profile",
    introduction: "Complete the required fields.",
    direction: "rtl",
    fields: [
      {
        name: "email",
        label: "Email",
        required: true,
        type: { kind: "email" },
      },
      {
        name: "enabled",
        label: { text: "Enabled", position: "side" },
        type: { kind: "boolean" },
      },
    ],
    buttons: [
      { id: "save", label: "Save", type: "save", order: 2 },
      { id: "cancel", label: "Cancel", type: "cancel", order: 1 },
    ],
  };
  const render = () =>
    renderToStaticMarkup(
      createElement(CiSmartForm<CiSmartFormValues>, {
        specifications: spec,
        data: { email: "person@example.com" },
      }),
    );
  const html = render();
  assert.equal(html, render());
  assert.match(html, /dir="rtl"/);
  assert.match(html, /aria-required="true"/);
  assert.match(html, /role="switch"/);
  assert.match(html, /value="person@example.com"/);
  assert.ok(
    html.indexOf('data-smart-button="cancel"') <
      html.indexOf('data-smart-button="save"'),
  );
});

test("fixed core forms ignore a replacement definition, specifications and template", () => {
  const coreForm = ciDefineSmartForm<CiSmartFormValues>({
    id: "fixed",
    category: "fixed",
    fields: [{ name: "safeField" }],
  });
  const override = ciDefineSmartForm<CiSmartFormValues>({
    id: "other",
    fields: [{ name: "injectedField" }],
  });
  const html = renderToStaticMarkup(
    createElement(CiSmartForm<CiSmartFormValues>, {
      coreForm,
      definition: override,
      specifications: override.specifications,
      template: { groups: [] },
    }),
  );
  assert.match(html, /safeField/);
  assert.doesNotMatch(html, /injectedField/);
});

test("selection controls preserve scalar storage types and alphabetize unordered labels", () => {
  const specifications: CiSmartFormSpec = {
    id: "choices",
    fields: [
      {
        name: "status",
        type: {
          kind: "singleSelect",
          options: [
            { value: 0, label: "Zulu" },
            { value: false, label: "Alpha" },
          ],
        },
      },
      {
        name: "tags",
        type: {
          kind: "multiSelect",
          display: "dropdown",
          options: [{ value: "a", label: "One" }],
        },
      },
      {
        name: "binary",
        type: {
          kind: "boolean",
          display: "radio",
          trueOption: { value: "Y", label: "Allowed" },
          falseOption: { value: "N", label: "Denied" },
        },
      },
    ],
  };
  const html = renderToStaticMarkup(
    createElement(CiSmartForm<CiSmartFormValues>, {
      specifications,
      data: { status: false, binary: "N", tags: ["a"] },
    }),
  );
  assert.ok(html.indexOf(">Alpha</option>") < html.indexOf(">Zulu</option>"));
  assert.match(html, /type="checkbox"/);
  assert.match(html, /1 selected/);
  assert.match(html, /role="radiogroup"/);
  assert.deepEqual(
    ciValidateSmartForm(specifications, {
      status: false,
      binary: "N",
      tags: ["a"],
    }),
    {},
  );
  assert.ok(
    ciValidateSmartForm(specifications, {
      status: "false",
      binary: false,
      tags: ["unknown"],
    }).status,
  );
});

test("validation covers mandatory fields, false booleans, ranges, object JSON, and hidden/disabled fields", () => {
  const spec: CiSmartFormSpec = {
    id: "validation",
    fields: [
      { name: "email", required: true, type: { kind: "email" } },
      {
        name: "count",
        type: { kind: "number" },
        validation: { min: 1, max: 5 },
      },
      { name: "active", required: true, type: { kind: "boolean" } },
      { name: "consent", required: true, type: { kind: "checkbox" } },
      {
        name: "details",
        required: true,
        visibleWhen: { field: "active", equals: true },
      },
      { name: "disabled", required: true, disabled: true },
      { name: "extensions", type: { kind: "jsonEditor", objectOnly: true } },
    ],
  };
  const errors = ciValidateSmartForm(spec, {
    email: "bad",
    count: 0,
    active: false,
    consent: false,
    details: "",
    extensions: [],
  });
  assert.deepEqual(Object.keys(errors), [
    "email",
    "count",
    "consent",
    "extensions",
  ]);
});

test("custom renderers are explicit and receive per-instance data", () => {
  const specifications: CiSmartFormSpec = {
    id: "custom",
    fields: [
      { name: "profile", type: { kind: "custom", renderer: "profile" } },
    ],
  };
  assert.throws(
    () =>
      renderToStaticMarkup(
        createElement(CiSmartForm<CiSmartFormValues>, { specifications }),
      ),
    /Missing Smart Form renderer/,
  );
  const html = renderToStaticMarkup(
    createElement(CiSmartForm<CiSmartFormValues>, {
      specifications,
      data: { profile: "Ada" },
      renderers: {
        profile: ({ id, value }) =>
          createElement("input", { id, value: String(value), readOnly: true }),
      },
    }),
  );
  assert.match(html, /value="Ada"/);
});

test("legacy Formik input and textarea fields render without recursive dispatch", () => {
  for (const type of ["input", "textarea"]) {
    const html = renderToStaticMarkup(
      createElement(Formik, {
        initialValues: { name: "Ada" },
        onSubmit: () => {},
        children: createElement(CiSmartFormField, {
          name: "name",
          label: "Name",
          type,
        }),
      }),
    );
    assert.match(html, /Ada/);
  }
});

test("sliders allow the first/only option to be selected, and action wording can vary per instance", () => {
  const specifications: CiSmartFormSpec = {
    id: "slider",
    fields: [
      {
        name: "priority",
        type: {
          kind: "singleSelect",
          display: "slider",
          options: [{ value: 0, label: "Normal" }],
        },
      },
      {
        name: "tags",
        type: {
          kind: "multiSelect",
          display: "chips",
          options: [{ value: "a", label: "Alpha" }],
        },
      },
    ],
  };
  const html = renderToStaticMarkup(
    createElement(CiSmartForm<CiSmartFormValues>, {
      specifications,
      data: { tags: ["a"] },
      buttonState: { save: { label: "Create administrator" } },
    }),
  );
  assert.match(html, /Select Normal/);
  assert.match(html, /Remove Alpha/);
  assert.match(html, /Create administrator/);
});

test("a required binary radio accepts the configured false value", () => {
  const spec: CiSmartFormSpec = {
    id: "binary",
    fields: [
      {
        name: "choice",
        required: true,
        type: { kind: "checkbox", display: "radio" },
      },
    ],
  };
  assert.deepEqual(ciValidateSmartForm(spec, { choice: false }), {});
});

test("customizable core forms accept a template-only override", () => {
  const coreForm = ciDefineSmartForm<CiSmartFormValues>({
    id: "layout",
    fields: [{ name: "first" }, { name: "second" }],
  });
  const html = renderToStaticMarkup(
    createElement(CiSmartForm<CiSmartFormValues>, {
      coreForm,
      template: {
        groups: [
          {
            name: "main",
            rows: [{ id: "both", fields: ["first", "second"], columns: 2 }],
          },
        ],
      },
    }),
  );
  assert.match(html, /sm:grid-cols-2/);
});

test("legacy dispatcher preserves the native password input type", () => {
  const html = renderToStaticMarkup(
    createElement(Formik, {
      initialValues: { password: "" },
      onSubmit: () => {},
      children: createElement(CiSmartFormField, {
        name: "password",
        type: "input",
        inputType: "password",
      }),
    }),
  );
  assert.match(html, /type="password"/);
});
