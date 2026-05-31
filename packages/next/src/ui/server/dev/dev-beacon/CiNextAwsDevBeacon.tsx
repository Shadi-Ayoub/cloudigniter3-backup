import { CiDevBeacon } from "./CiDevBeacon";
import type { CiNexAwsDevBeaconProps } from "./types";

export function CiNextAwsDevBeacon({ config }: CiNexAwsDevBeaconProps) {
  return <CiDevBeacon {...config} />;
}
