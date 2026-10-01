import type {
  CiSettings,
  CiSettingsGroup,
  CiSettingsManager,
  CiSettingsManagerOptions,
  CiSettingsRecord,
  CiSettingsUpdate,
  CiSettingsStoreSetInput,
  CiSettingsStoreCondition,
  CiSettingsOverwriteSelection,
  CiSettingsTarget,
} from "@ci-core/types";
import { ciMergeSettings } from "./ci-merge-settings";
import {
  ciParseSettingsEnforcement,
  ciParseSettingsTarget,
  ciSettingsSelectionFields,
  ciSettingsTargetKey,
} from "./ci-settings-target";
import { ciResolveRequestSettings } from "./ci-resolve-request-settings";

/** Category, tenant and owner boundaries are enforced before every persistence operation. */
export function ciCreateSettingsManager({
  registry,
  store,
  actor,
  canManage,
  target: inputTarget,
  validateTarget,
}: CiSettingsManagerOptions): CiSettingsManager {
  const target = ciParseSettingsTarget(inputTarget);
  const system: CiSettingsTarget = { scope: "system" };
  const validated = new Map<string, Promise<void>>();
  function validate(boundary: CiSettingsTarget) {
    const id = ciSettingsTargetKey(boundary);
    if (!validated.has(id))
      validated.set(id, validateTarget?.(boundary) ?? Promise.resolve());
    return validated.get(id)!;
  }
  function signedIn() {
    if (!actor.authenticated || !actor.id)
      throw new Error("Sign in to manage settings.");
  }
  function key(id: string, boundary = target) {
    const entry = registry.get(id);
    if (entry.scope !== "public" && (!actor.authenticated || !actor.id))
      throw new Error("Sign in to access private or personal settings.");
    // Preferences are account-wide, independent of the current tenant.
    return {
      settingsId: id,
      scope: entry.scope,
      targetTenantScope:
        entry.scope === "user" ? ("system" as const) : boundary.scope,
      ...(entry.scope !== "user" && boundary.scope === "tenant"
        ? { tenantId: boundary.tenantId }
        : {}),
      ...(entry.scope === "user" ? { userId: actor.id! } : {}),
    };
  }
  function group(id: string, record: CiSettingsRecord | null): CiSettingsGroup {
    const entry = registry.get(id);
    const value = ciMergeSettings<CiSettings>(
      entry.defaults ?? {},
      record?.value,
    );
    return {
      id,
      scope: entry.scope,
      title: entry.meta?.title ?? id,
      description: entry.meta?.description,
      fields: entry.fields ?? [],
      value: entry.schema ? entry.schema.parse(value) : value,
      revision: record?.revision ?? 0,
      alwaysLoad: entry.alwaysLoad === true,
      ...(entry.scope !== "user" && target.scope === "system"
        ? {
            enforcement: ciParseSettingsEnforcement(
              record?.enforcement ?? [],
              entry,
            ),
          }
        : {}),
    };
  }
  async function snapshot(id: string) {
    const recordKey = key(id);
    const scoped = recordKey.scope !== "user" && target.scope !== "system";
    if (recordKey.scope !== "user") await validate(target);
    if (!scoped) {
      const record = await store.get(recordKey);
      return {
        record,
        local: group(id, record),
        effective: group(id, record),
        source: undefined,
      };
    }
    for (let attempt = 0; ; attempt++) {
      // group() deliberately omits rules outside System; read the source record explicitly.
      const sourceRecord = await store.get(key(id, system));
      const primary = group(id, sourceRecord);
      const rules = ciParseSettingsEnforcement(
        sourceRecord?.enforcement ?? [],
        registry.get(id),
      );
      let record = await store.get(recordKey);
      if (!record) {
        if (!store.initialize)
          throw new Error(
            "The settings provider does not support tenant copies.",
          );
        try {
          record = await store.initialize(
            { ...recordKey, value: primary.value, expectedRevision: 0 },
            { ...key(id, system), revision: primary.revision },
          );
        } catch (error) {
          if (
            attempt < 2 &&
            error instanceof Error &&
            error.name === "SettingsSnapshotConflict"
          )
            continue;
          throw error;
        }
      }
      const local = group(id, record);
      const locked = new Set<string>();
      for (const rule of rules) {
        if (
          rule.targets !== "*" &&
          !rule.targets.some(
            (item) => ciSettingsTargetKey(item) === ciSettingsTargetKey(target),
          )
        )
          continue;
        const fields =
          rule.fields === "*"
            ? new Set([
                ...Object.keys(primary.value),
                ...Object.keys(local.value),
                ...(registry.get(id).fields ?? []).map((field) => field.name),
              ])
            : rule.fields;
        for (const field of fields) locked.add(field);
      }
      const value = { ...local.value };
      for (const field of locked) {
        if (Object.hasOwn(primary.value, field))
          value[field] = primary.value[field]!;
        else delete value[field];
      }
      const schema = registry.get(id).schema;
      return {
        record,
        local,
        source: primary,
        effective: {
          ...local,
          value: schema ? schema.parse(value) : value,
          lockedFields: [...locked],
          systemRevision: primary.revision,
        },
      };
    }
  }
  async function read(id: string) {
    return (await snapshot(id)).effective;
  }
  function parseUpdate(update: CiSettingsUpdate) {
    const recordKey = key(update.id);
    if (!Number.isSafeInteger(update.revision) || update.revision < 0)
      throw new Error("Invalid settings revision.");
    const entry = registry.get(update.id);
    if (!entry.schema)
      throw new Error(
        `Settings group ${update.id} requires a validation schema before it can be saved.`,
      );
    const parsed = entry.schema.safeParse(update.value);
    if (!parsed.success)
      throw new Error(
        `${entry.meta?.title ?? update.id}: ${parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`,
      );
    return {
      ...recordKey,
      value: parsed.data,
      expectedRevision: update.revision,
    };
  }
  async function prepare(updates: readonly CiSettingsUpdate[]) {
    signedIn();
    if (!Array.isArray(updates) || !updates.length)
      throw new Error("Provide at least one settings group.");
    const scope = registry.get(updates[0]!.id).scope;
    if (scope !== "user" && !(await canManage("update", target)))
      throw new Error("Settings update access is required.");
    const ids = new Set<string>();
    const inputs: CiSettingsStoreSetInput[] = updates.map((update) => {
      if (ids.has(update.id)) throw new Error("Duplicate settings group.");
      ids.add(update.id);
      if (registry.get(update.id).scope !== scope)
        throw new Error("Save one settings category at a time.");
      return parseUpdate(update);
    });
    const conditions: CiSettingsStoreCondition[] = [];
    if (scope === "user") {
      if (
        updates.some(
          (update) =>
            update.enforcement !== undefined ||
            update.systemRevision !== undefined,
        )
      )
        throw new Error("Personal settings cannot use tenant enforcement.");
      return { inputs, conditions };
    }
    await validate(target);
    for (let index = 0; index < updates.length; index++) {
      const update = updates[index]!;
      const input = inputs[index]!;
      if (target.scope === "system") {
        const current = await store.get(key(update.id));
        const previous = ciParseSettingsEnforcement(
          current?.enforcement ?? [],
          registry.get(update.id),
        );
        input.enforcement =
          update.enforcement === undefined
            ? previous
            : ciParseSettingsEnforcement(
                update.enforcement,
                registry.get(update.id),
              );
        if (JSON.stringify(input.enforcement) !== JSON.stringify(previous)) {
          if (!(await canManage("enforce", system)))
            throw new Error(
              "System settings enforcement permission is required.",
            );
          for (const rule of input.enforcement)
            if (rule.targets !== "*")
              for (const item of rule.targets) await validate(item);
        }
      } else {
        if (update.enforcement !== undefined)
          throw new Error("Only System settings can define enforcement.");
        const current = await snapshot(update.id);
        if (update.systemRevision !== current.source!.revision)
          throw new Error(
            "System settings or enforcement changed. Reload before saving.",
          );
        if (update.revision !== current.local.revision)
          throw new Error("These settings changed. Reload before saving.");
        for (const field of current.effective.lockedFields ?? []) {
          if (
            JSON.stringify(input.value[field]) !==
            JSON.stringify(current.effective.value[field])
          )
            throw new Error(
              `${field} is enforced by System and cannot be changed.`,
            );
          // A tenant save must not replace the hidden local value with the enforced value.
          if (Object.hasOwn(current.local.value, field))
            input.value[field] = current.local.value[field]!;
          else delete input.value[field];
        }
        conditions.push({
          ...key(update.id, system),
          revision: current.source!.revision,
        });
      }
    }
    return { inputs, conditions };
  }
  async function saveAll(updates: readonly CiSettingsUpdate[]) {
    const { inputs, conditions } = await prepare(updates);
    if (!store.setMany)
      throw new Error(
        "The settings provider does not support saving a complete form.",
      );
    const saved = await store.setMany(inputs, conditions);
    return Promise.all(
      inputs.map(async (input) => {
        const record = saved.find(
          (item) => item.settingsId === input.settingsId,
        );
        if (!record)
          throw new Error(
            "The settings provider returned an incomplete save result.",
          );
        return target.scope !== "system" && input.scope !== "user"
          ? read(input.settingsId)
          : group(input.settingsId, record);
      }),
    );
  }
  return {
    read,
    async list(scope) {
      signedIn();
      if (scope !== "user" && !(await canManage("read", target)))
        throw new Error("Settings management access is required.");
      const groups = await Promise.all(
        Object.keys(registry.listByScope(scope)).map(read),
      );
      return groups.sort(
        (a, b) =>
          (registry.get(a.id).meta?.order ?? 0) -
            (registry.get(b.id).meta?.order ?? 0) ||
          a.title.localeCompare(b.title),
      );
    },
    async save(id, value, revision, options) {
      const updates = [{ id, value, revision, ...options }];
      if (target.scope !== "system" && registry.get(id).scope !== "user")
        return (await saveAll(updates))[0]!;
      const { inputs } = await prepare(updates);
      return group(id, await store.set(inputs[0]!));
    },
    saveAll,
    async overwrite(selection: readonly CiSettingsOverwriteSelection[]) {
      signedIn();
      if (target.scope === "system")
        throw new Error("Choose GLOBAL or a tenant to overwrite.");
      if (
        !(await canManage("overwrite", system)) ||
        !(await canManage("overwrite", target))
      )
        throw new Error(
          "System settings overwrite permission is required and tenant restrictions must allow it.",
        );
      if (
        !Array.isArray(selection) ||
        !selection.length ||
        new Set(selection.map((item) => item.id)).size !== selection.length
      )
        throw new Error("Select unique settings groups to overwrite.");
      const scope = registry.get(selection[0]!.id).scope;
      if (
        scope === "user" ||
        selection.some((item) => registry.get(item.id).scope !== scope)
      )
        throw new Error("Overwrite one Public or Private category at a time.");
      await validate(target);
      const inputs: CiSettingsStoreSetInput[] = [];
      const conditions: CiSettingsStoreCondition[] = [];
      for (const item of selection) {
        const entry = registry.get(item.id);
        const fields = ciSettingsSelectionFields(item.fields, entry);
        const current = await snapshot(item.id);
        if (current.source!.revision !== item.systemRevision)
          throw new Error(
            "System settings changed. Reload before overwriting.",
          );
        const value = { ...current.local.value };
        for (const field of fields === "*"
          ? new Set([
              ...Object.keys(value),
              ...Object.keys(current.source!.value),
            ])
          : fields) {
          if (Object.hasOwn(current.source!.value, field))
            value[field] = current.source!.value[field]!;
          else delete value[field];
        }
        inputs.push(
          parseUpdate({ id: item.id, value, revision: current.local.revision }),
        );
        conditions.push({
          ...key(item.id, system),
          revision: item.systemRevision,
        });
      }
      if (!store.setMany)
        throw new Error(
          "The settings provider does not support atomic overwrites.",
        );
      await store.setMany(inputs, conditions);
      return Promise.all(selection.map((item) => read(item.id)));
    },
    loadRequest: (ids, cookies) =>
      ciResolveRequestSettings(registry, actor, read, ids, cookies),
  };
}
