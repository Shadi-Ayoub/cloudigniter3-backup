import type {
  CiCanOverrideSettingsValue,
  CiSettings,
  CiSettingsLayerName,
  CiSettingsValue,
} from "@cloudigniter/core";
import { ciCloneSettingsValue } from "./ci-clone-settings-value";

/**
 * Merge a candidate layer into a base settings object while consulting an
 * optional override policy.
 *
 * @param input - Merge input.
 * @returns Updated merged settings object.
 */
export async function ciMergeSettingsWithControl<
  TSettings extends CiSettings,
>(input: {
  settingsId: string;
  baseValue: TSettings;
  incomingValue?: Partial<TSettings>;
  fromLayer: CiSettingsLayerName;
  toLayer: CiSettingsLayerName;
  tenantId?: string;
  userId?: string;
  canOverride?: CiCanOverrideSettingsValue;
}): Promise<TSettings> {
  const {
    settingsId,
    baseValue,
    incomingValue,
    fromLayer,
    toLayer,
    tenantId,
    userId,
    canOverride,
  } = input;

  if (!incomingValue) {
    return baseValue;
  }

  const ciMergeObject = async (
    current: Record<string, CiSettingsValue>,
    incoming: Record<string, CiSettingsValue>,
    parentPath = "",
  ): Promise<Record<string, CiSettingsValue>> => {
    const ciOutput: Record<string, CiSettingsValue> = { ...current };

    for (const [key, nextValue] of Object.entries(incoming)) {
      const ciPath = parentPath ? `${parentPath}.${key}` : key;
      const ciCurrentValue = ciOutput[key];

      if (
        ciCurrentValue &&
        nextValue &&
        typeof ciCurrentValue === "object" &&
        typeof nextValue === "object" &&
        !Array.isArray(ciCurrentValue) &&
        !Array.isArray(nextValue)
      ) {
        ciOutput[key] = await ciMergeObject(
          ciCurrentValue as Record<string, CiSettingsValue>,
          nextValue as Record<string, CiSettingsValue>,
          ciPath,
        );
        continue;
      }

      const ciAllowed = canOverride
        ? await canOverride({
            settingsId,
            path: ciPath,
            fromLayer,
            toLayer,
            tenantId,
            userId,
            currentValue: ciCurrentValue,
            nextValue,
          })
        : true;

      if (ciAllowed) {
        ciOutput[key] = ciCloneSettingsValue(nextValue);
      }
    }

    return ciOutput;
  };

  return (await ciMergeObject(
    baseValue as Record<string, CiSettingsValue>,
    incomingValue as Record<string, CiSettingsValue>,
  )) as TSettings;
}
