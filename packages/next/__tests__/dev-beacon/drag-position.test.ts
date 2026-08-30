import assert from "node:assert/strict";
import test from "node:test";

import {
  ciClampDevBeaconDragPosition,
  ciHasDevBeaconDragStarted,
} from "../../src/modules/dev/dev-beacon/client/components/ci-dev-beacon-drag";

test("clamps a dragged Dev Beacon button inside the viewport", () => {
  assert.deepEqual(
    ciClampDevBeaconDragPosition(
      { left: 900, top: -20 },
      { width: 48, height: 48 },
      { width: 800, height: 600 },
    ),
    { left: 752, top: 0 },
  );
});

test("keeps the Dev Beacon visible when the viewport is smaller than it", () => {
  assert.deepEqual(
    ciClampDevBeaconDragPosition(
      { left: 20, top: 30 },
      { width: 48, height: 48 },
      { width: 32, height: 40 },
    ),
    { left: 0, top: 0 },
  );
});

test("starts dragging only after the pointer crosses the movement threshold", () => {
  assert.equal(ciHasDevBeaconDragStarted(2, 3), false);
  assert.equal(ciHasDevBeaconDragStarted(4, 0), true);
  assert.equal(ciHasDevBeaconDragStarted(3, 3), true);
});
