import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { ciSerializeUserProfileAwsJsonFields } from "@cloudigniter/aws/lib";
import type { CIUserSeederDataItem } from "@cloudigniter/core/types";

const fixtures = JSON.parse(
  readFileSync(
    new URL(
      "../../../src/custom/dev/seeder/data/users/users.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as CIUserSeederDataItem[];

const outputs = JSON.parse(
  readFileSync(
    new URL("../../../amplify_outputs.json", import.meta.url),
    "utf8",
  ),
) as {
  data: {
    model_introspection: {
      models: {
        UserProfile: {
          fields: Record<string, { type: string }>;
        };
      };
    };
  };
};

test("keeps the three disposable user fixtures object-shaped", () => {
  assert.deepEqual(
    fixtures.map((fixture) => fixture.email),
    [
      "shadi.ayoub.test1@gmail.com",
      "shadi.ayoub.test2@gmail.com",
      "shadi.ayoub.test3@gmail.com",
    ],
  );

  for (const fixture of fixtures) {
    assert.ok(fixture.profile?.address);
    assert.equal(Array.isArray(fixture.profile.address), false);
    assert.equal(typeof fixture.profile.address, "object");

    const extensions = {
      ...fixture.profile.extensions,
      cloudigniterSeeder: "test-users",
    };
    const variables = ciSerializeUserProfileAwsJsonFields({
      address: fixture.profile.address,
      extensions,
    });
    assert.equal(typeof variables.address, "string");
    assert.deepEqual(
      JSON.parse(variables.address ?? ""),
      fixture.profile.address,
    );
    assert.deepEqual(JSON.parse(variables.extensions ?? ""), extensions);
  }
});

test("declares every structured UserProfile transport field as AWSJSON", () => {
  const fields = outputs.data.model_introspection.models.UserProfile.fields;

  for (const field of ["address", "extensions", "statusChange", "deletion"]) {
    assert.equal(fields[field]?.type, "AWSJSON", `${field} must stay AWSJSON`);
  }
});
