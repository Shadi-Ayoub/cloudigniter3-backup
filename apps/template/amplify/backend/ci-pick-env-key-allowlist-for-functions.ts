import type {
  CiCoreFunctionId,
  CiResourceEnvKeyAllowlist,
} from "@cloudigniter/aws/server/backend";

export function ciPickEnvKeyAllowlistForFunctions<
  TFunctions extends Partial<Record<CiCoreFunctionId, unknown>>,
>(
  allowlist: CiResourceEnvKeyAllowlist,
  functions: TFunctions,
): Partial<
  Record<Extract<keyof TFunctions, CiCoreFunctionId>, readonly string[]>
> {
  const result: Partial<
    Record<Extract<keyof TFunctions, CiCoreFunctionId>, readonly string[]>
  > = {};

  for (const fnId of Object.keys(functions) as Extract<
    keyof TFunctions,
    CiCoreFunctionId
  >[]) {
    const keys = allowlist[fnId];
    if (keys?.length) {
      result[fnId] = keys;
    }
  }

  return result;
}
