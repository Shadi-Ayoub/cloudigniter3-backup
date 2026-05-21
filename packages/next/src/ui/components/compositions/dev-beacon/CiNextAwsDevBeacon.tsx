import { CiDevBeacon } from "@cloudigniter/core/server";
import type { CiNexAwsDevBeaconProps } from "./types";

export function CiNextAwsDevBeacon({ config }: CiNexAwsDevBeaconProps) {
  return <CiDevBeacon {...config} />;
}
