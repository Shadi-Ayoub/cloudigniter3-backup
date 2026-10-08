import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { a } from "@aws-amplify/backend";
import schemaUser from "../../data/schemata/schema-user";

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

// Transform the maintained schema offline; deployment outputs may be absent or stale.
const userSchema = a.schema(schemaUser).transform().schema;

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
  for (const field of ["address", "extensions", "statusChange", "deletion"]) {
    assert.match(userSchema, new RegExp(`^  ${field}: AWSJSON(?:[!\\s]|$)`, "m"), `${field} must stay AWSJSON`);
  }
});
