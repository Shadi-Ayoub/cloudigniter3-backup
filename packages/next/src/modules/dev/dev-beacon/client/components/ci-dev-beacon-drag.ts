const CI_DEV_BEACON_DRAG_ACTIVATION_DISTANCE = 4;

type CiDevBeaconDragPosition = {
  left: number;
  top: number;
};

type CiDevBeaconDragBounds = {
  width: number;
  height: number;
};

function ciClampDevBeaconDragPosition(
  position: CiDevBeaconDragPosition,
  button: CiDevBeaconDragBounds,
  viewport: CiDevBeaconDragBounds,
): CiDevBeaconDragPosition {
  return {
    left: Math.min(
      Math.max(position.left, 0),
      Math.max(viewport.width - button.width, 0),
    ),
    top: Math.min(
      Math.max(position.top, 0),
      Math.max(viewport.height - button.height, 0),
    ),
  };
}

function ciHasDevBeaconDragStarted(deltaX: number, deltaY: number): boolean {
  return Math.hypot(deltaX, deltaY) >= CI_DEV_BEACON_DRAG_ACTIVATION_DISTANCE;
}

export {
  ciClampDevBeaconDragPosition,
  ciHasDevBeaconDragStarted,
  type CiDevBeaconDragPosition,
};
