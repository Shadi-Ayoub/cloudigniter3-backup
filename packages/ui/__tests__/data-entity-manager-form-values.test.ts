import assert from "node:assert/strict";
import test from "node:test";

import type { CiDataEntityField } from "../src/types";
import {
  ciCreateDataEntityFormDraft,
  ciParseDataEntityFormDraft,
} from "../src/client/components/data-entity-manager/lib/ci-data-entity-form-values";

type ExampleRecord = {
  title: string;
  price?: number;
  published?: boolean;
  tags?: string[];
  metadata?: unknown;
  releaseDate?: string;
};

const fields = [
  { name: "title", label: "Title", valueKind: "string", required: true },
  { name: "price", label: "Price", valueKind: "number" },
  {
    name: "published",
    label: "Published",
    valueKind: "boolean",
    defaultValue: false,
  },
  {
    name: "tags",
    label: "Tags",
    valueKind: "string",
    array: true,
    itemsRequired: true,
  },
  { name: "metadata", label: "Metadata", valueKind: "json" },
  {
    name: "releaseDate",
    label: "Release date",
    valueKind: "string",
    inputKind: "date",
  },
] satisfies readonly CiDataEntityField<ExampleRecord>[];

test("creates lossless editor drafts from defaults and existing values", () => {
  assert.deepEqual(ciCreateDataEntityFormDraft(fields), {
    title: "",
    price: "",
    published: "false",
    tags: "",
    metadata: "",
    releaseDate: "",
  });

  assert.deepEqual(
    ciCreateDataEntityFormDraft(fields, {
      title: "Cloud patterns",
      price: 12.5,
      published: true,
      tags: ["architecture", "aws"],
      metadata: { edition: 2 },
      releaseDate: "2026-08-16",
    }),
    {
      title: "Cloud patterns",
      price: "12.5",
      published: "true",
      tags: '[\n  "architecture",\n  "aws"\n]',
      metadata: '{\n  "edition": 2\n}',
      releaseDate: "2026-08-16",
    },
  );
});

test("parses provider-neutral scalar, date, JSON, and array values", () => {
  const result = ciParseDataEntityFormDraft(
    fields,
    {
      title: "Cloud patterns",
      price: "12.5",
      published: "true",
      tags: '["architecture", "aws"]',
      metadata: '{"edition":2}',
      releaseDate: "2026-08-16",
    },
    "create",
  );

  assert.equal(result.ok, true);
  assert.deepEqual(result.values, {
    title: "Cloud patterns",
    price: 12.5,
    published: true,
    tags: ["architecture", "aws"],
    metadata: { edition: 2 },
    releaseDate: "2026-08-16",
  });
});

test("clears optional stored values with null only when editing", () => {
  const draft = {
    title: "Cloud patterns",
    price: "",
    published: "",
    tags: "",
    metadata: "",
    releaseDate: "",
  };

  assert.deepEqual(ciParseDataEntityFormDraft(fields, draft, "create").values, {
    title: "Cloud patterns",
    price: undefined,
    published: undefined,
    tags: undefined,
    metadata: undefined,
    releaseDate: undefined,
  });
  assert.deepEqual(ciParseDataEntityFormDraft(fields, draft, "edit").values, {
    title: "Cloud patterns",
    price: null,
    published: null,
    tags: null,
    metadata: null,
    releaseDate: null,
  });
});

test("reports required, JSON, and typed-array errors by field", () => {
  const result = ciParseDataEntityFormDraft(
    fields,
    {
      title: " ",
      price: "not-a-number",
      published: "maybe",
      tags: '["valid", null]',
      metadata: "{broken",
      releaseDate: "",
    },
    "edit",
  );

  assert.equal(result.ok, false);
  assert.deepEqual(result.errors, {
    title: "Title is required.",
    price: "Price must be a finite number.",
    published: "Published must be true or false.",
    tags: "Tags cannot contain null values.",
    metadata: "Metadata must contain valid JSON.",
  });
});

test("runs custom validation after every field has been parsed", () => {
  const validatedFields = [
    ...fields,
    {
      name: "title",
      label: "Title",
      valueKind: "string",
      validate: (
        value: unknown,
        values: Partial<ExampleRecord>,
        mode: "create" | "edit",
      ) =>
        mode === "create" && value === "Reserved" && values.published === true
          ? "Published records cannot use the reserved title."
          : undefined,
    } as const,
  ].slice(1) satisfies readonly CiDataEntityField<ExampleRecord>[];

  const result = ciParseDataEntityFormDraft(
    validatedFields,
    {
      title: "Reserved",
      price: "",
      published: "true",
      tags: "",
      metadata: "",
      releaseDate: "",
    },
    "create",
  );

  assert.equal(result.ok, false);
  assert.equal(
    result.errors.title,
    "Published records cannot use the reserved title.",
  );
});
