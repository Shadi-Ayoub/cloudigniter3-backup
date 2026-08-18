import assert from "node:assert/strict";
import test from "node:test";

import {
  ciBuildDataTableRecordFields,
  ciFormatDataTableRecordJson,
  ciHasDataTableRecordDescription,
} from "../src/client/components/data-table/lib/ci-data-table-record-display";

test("builds nested label/value fields with children under their parent", () => {
  const fields = ciBuildDataTableRecordFields({
    id: "tenant-123",
    profile: {
      name: "Example tenant",
      locations: ["Dubai", "Abu Dhabi"],
    },
  });

  assert.deepEqual(fields, [
    { id: "id", label: "id", value: "tenant-123" },
    {
      id: "profile",
      label: "profile",
      children: [
        {
          id: "profile.name",
          label: "name",
          value: "Example tenant",
        },
        {
          id: "profile.locations",
          label: "locations",
          children: [
            {
              id: "profile.locations.[0]",
              label: "[0]",
              value: "Dubai",
            },
            {
              id: "profile.locations.[1]",
              label: "[1]",
              value: "Abu Dhabi",
            },
          ],
        },
      ],
    },
  ]);
});

test("formats circular records and bigint values without throwing", () => {
  const record: Record<string, unknown> = { count: 12n };
  record.self = record;

  assert.equal(
    ciFormatDataTableRecordJson(record),
    '{\n  "count": "12n",\n  "self": "[Circular]"\n}'
  );
});

test("recognizes only meaningful descriptions", () => {
  assert.equal(ciHasDataTableRecordDescription(undefined), false);
  assert.equal(ciHasDataTableRecordDescription("   "), false);
  assert.equal(ciHasDataTableRecordDescription([null, ""]), false);
  assert.equal(ciHasDataTableRecordDescription("Tenant details"), true);
  assert.equal(ciHasDataTableRecordDescription([null, "Role details"]), true);
});
