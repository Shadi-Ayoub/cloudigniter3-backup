import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

type OrgUnitFixture = {
  orgUnitId: string;
  parentId?: string;
  tenantIds: string[];
};

type TenantFixture = {
  tenantId: string;
  tenantType?: string;
  orgUnits?: OrgUnitFixture[];
};

const fixtures = JSON.parse(
  readFileSync(
    new URL(
      "../../../src/custom/dev/seeder/data/tenants/tenants.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as TenantFixture[];

test("models disposable multi-company Org Units with a shared headquarters", () => {
  const tenantIds = new Set(fixtures.map((fixture) => fixture.tenantId));
  const orgUnits = fixtures.flatMap((fixture) => fixture.orgUnits ?? []);
  const orgUnitById = new Map(
    orgUnits.map((orgUnit, index) => [orgUnit.orgUnitId, { orgUnit, index }]),
  );
  const centralHeadquarters = orgUnits.find(
    (orgUnit) => orgUnit.orgUnitId === "dev-northstar-central-hq",
  );

  assert.equal(fixtures.length, 4);
  assert.equal(
    fixtures.filter((fixture) => fixture.tenantType === "company").length,
    3,
  );
  assert.deepEqual(
    new Set(centralHeadquarters?.tenantIds),
    tenantIds,
    "the central headquarters must be attached to every company tenant",
  );
  assert.ok(
    orgUnits.filter((orgUnit) => orgUnit.tenantIds.length > 1).length >= 3,
    "the fixture must exercise shared departments and a shared subtree",
  );
  assert.ok(
    orgUnits.some((orgUnit) => orgUnit.tenantIds.length === 1),
    "the fixture must also exercise company-specific departments",
  );

  for (const { orgUnit, index } of orgUnitById.values()) {
    assert.ok(
      orgUnit.tenantIds.every((tenantId) => tenantIds.has(tenantId)),
      `${orgUnit.orgUnitId} must reference only seeded tenants`,
    );
    if (!orgUnit.parentId) continue;
    const parent = orgUnitById.get(orgUnit.parentId);
    assert.ok(parent, `${orgUnit.orgUnitId} must reference a seeded parent`);
    assert.ok(
      parent.index < index,
      `${orgUnit.orgUnitId} must appear after its parent for deterministic seeding`,
    );
    assert.ok(
      orgUnit.tenantIds.every((tenantId) =>
        parent.orgUnit.tenantIds.includes(tenantId),
      ),
      `${orgUnit.orgUnitId} tenant attachments must be contained by its parent`,
    );
  }
});
