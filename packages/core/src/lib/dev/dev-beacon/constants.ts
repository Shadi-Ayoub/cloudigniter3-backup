import type {
  CiDevBeaconLogoSpec,
  CiDevBeaconOptions,
  CiDevBeaconPosition,
} from "@ci-core/types";

/** Selects the original image in Light mode and the built-in outline icon in Dark mode. */
export const CI_DEV_BEACON_LOGO: CiDevBeaconLogoSpec = {
  kind: "default",
};

export const CI_DEFAULT_DEV_BEACON_OPTIONS: Required<CiDevBeaconOptions> = {
  enabled: false,
  allowProduction: false,
  requiredRoles: ["developer"],
};

export const CI_DEFAULT_DEV_BEACON_POSITION_CLASSES = {
  "top-left": "ci-dev-beacon-location-top-left",
  "top-middle": "ci-dev-beacon-location-top-middle",
  "top-right": "ci-dev-beacon-location-top-right",
  "left-middle": "ci-dev-beacon-location-left-middle",
  "right-middle": "ci-dev-beacon-location-right-middle",
  "bottom-left": "ci-dev-beacon-location-bottom-left",
  "bottom-middle": "ci-dev-beacon-location-bottom-middle",
  "bottom-right": "ci-dev-beacon-location-bottom-right",
} as const satisfies Record<CiDevBeaconPosition, string>;
