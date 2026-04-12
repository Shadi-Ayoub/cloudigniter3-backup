import { ciBuildResourceEnvMap } from "../resources";
import type {
  CiCoreAuth,
  CiCoreRuntime,
  CiEnvMap,
  CiPlanOptions,
} from "../core-types";

export function ciPrepareEnvironmentVars(
  rt: CiCoreRuntime,
  options: CiPlanOptions,
  extra?: { auth?: CiCoreAuth },
): CiEnvMap {
  return ciBuildResourceEnvMap({
    resources: rt.resources,
    region: rt.region,
    envMode: rt.envMode,
    options,
    extra,
  });
}
