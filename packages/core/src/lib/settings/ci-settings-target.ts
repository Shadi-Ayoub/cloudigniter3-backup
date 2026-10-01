import type {
  CiSettingsTarget,
  CiSettingsEnforcementRule,
  CiSettingsRegistryEntry,
} from "@ci-core/types";

/** Reject ambiguous boundaries and preserve opaque tenant identifiers exactly. */
export function ciParseSettingsTarget(
  value: unknown = { scope: "system" },
): CiSettingsTarget {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid settings target.");
  const input = value as Record<string, unknown>;
  if (input.scope === "system" || input.scope === "global") {
    if (Object.keys(input).length !== 1)
      throw new Error("Invalid settings target fields.");
    return { scope: input.scope };
  }
  if (
    input.scope !== "tenant" ||
    Object.keys(input).length !== 2 ||
    typeof input.tenantId !== "string" ||
    !input.tenantId ||
    input.tenantId.length > 128 ||
    input.tenantId.trim() !== input.tenantId ||
    /[#\x00-\x1f]/.test(input.tenantId)
  )
    throw new Error("Invalid settings tenant target.");
  return { scope: "tenant", tenantId: input.tenantId };
}

export function ciSettingsTargetKey(target: CiSettingsTarget): string {
  return target.scope === "tenant" ? `tenant:${target.tenantId}` : target.scope;
}

/** Field selections use top-level schema keys, matching Smart Form fields. */
export function ciSettingsSelectionFields(
  value: unknown,
  entry: CiSettingsRegistryEntry,
): "*" | string[] {
  if (value === "*") return "*";
  const allowed = new Set([
    ...Object.keys(entry.defaults ?? {}),
    ...(entry.fields ?? []).map((field) => field.name),
  ]);
  if (
    !Array.isArray(value) ||
    !value.length ||
    value.length > 100 ||
    value.some(
      (field) =>
        typeof field !== "string" ||
        !allowed.has(field) ||
        ["__proto__", "constructor", "prototype"].includes(field),
    ) ||
    new Set(value).size !== value.length
  )
    throw new Error("Select valid, unique settings fields.");
  return [...value].sort();
}

export function ciParseSettingsEnforcement(
  value: unknown,
  entry: CiSettingsRegistryEntry,
): CiSettingsEnforcementRule[] {
  if (!Array.isArray(value) || value.length > 100)
    throw new Error("Invalid settings enforcement rules.");
  return value.map((rule) => {
    if (
      !rule ||
      typeof rule !== "object" ||
      Array.isArray(rule) ||
      Object.keys(rule).some((key) => !["fields", "targets"].includes(key))
    )
      throw new Error("Invalid enforcement rule.");
    const fields = ciSettingsSelectionFields(rule.fields, entry);
    if (rule.targets === "*") return { fields, targets: "*" };
    if (
      !Array.isArray(rule.targets) ||
      !rule.targets.length ||
      rule.targets.length > 100
    )
      throw new Error("Select enforcement targets.");
    const targets = rule.targets.map((value: unknown) => {
      const target = ciParseSettingsTarget(value);
      if (target.scope === "system")
        throw new Error("System cannot be an enforcement target.");
      return target;
    });
    if (new Set(targets.map(ciSettingsTargetKey)).size !== targets.length)
      throw new Error("Duplicate enforcement target.");
    return { fields, targets };
  });
}
