import assert from "node:assert/strict";
import test from "node:test";

import { ciEstimateDataTableColumnSize } from "../src/client/components/data-table/lib/ci-data-table-column-sizing";

test("weights automatic data-table widths toward longer content", () => {
  const short = ciEstimateDataTableColumnSize({
    header: "Name",
    values: ["Users"],
  });
  const long = ciEstimateDataTableColumnSize({
    header: "Name",
    values: ["Access-control management"],
  });

  assert.ok(long > short);
  assert.ok(long >= 200);
});

test("respects configured minimum and maximum column sizes", () => {
  assert.equal(
    ciEstimateDataTableColumnSize({
      header: "Name",
      values: ["Short"],
      minSize: 220,
    }),
    220,
  );
  assert.equal(
    ciEstimateDataTableColumnSize({
      header: "Description",
      values: ["A very long value that must remain bounded by the column"],
      maxSize: 160,
    }),
    160,
  );
});

test("uses array and non-Latin scalar content without serializing objects", () => {
  const scalarSize = ciEstimateDataTableColumnSize({
    values: [["Dubai", "Abu Dhabi"], "إدارة الوصول"],
  });
  const objectSize = ciEstimateDataTableColumnSize({
    values: [{ deeply: { nested: "record" } }],
  });

  assert.ok(scalarSize > objectSize);
});
