import type { CiDevBeaconLogoSpec, CiDevBeaconPosition } from "@ci-core/types";

export const CI_DEV_BEACON_DEFAULT_POSITION_CLASSES = {
  "top-left": "ci-dev-beacon-location-top-left",
  "top-middle": "ci-dev-beacon-location-top-middle",
  "top-right": "ci-dev-beacon-location-top-right",
  "left-middle": "ci-dev-beacon-location-left-middle",
  "right-middle": "ci-dev-beacon-location-right-middle",
  "bottom-left": "ci-dev-beacon-location-bottom-left",
  "bottom-middle": "ci-dev-beacon-location-bottom-middle",
  "bottom-right": "ci-dev-beacon-location-bottom-right",
} as const satisfies Record<CiDevBeaconPosition, string>;

export const CI_DEV_BEACON_LOGO: CiDevBeaconLogoSpec = {
  kind: "image",
  src: "/images/cloudigniter-icon-1.png",
  alt: "CloudIgniter",
  sizePx: 28,
};
