import {
  ciCreateSettingsManager,
  ciParseGraphqlResponse,
  ciParseSettingsTarget,
  ciParseSettingsEnforcement,
  ciResolveRequestSettings,
} from "@cloudigniter/core/lib";
import type {
  CiGraphQLResponse,
  CiSettingsGroup,
  CiSettingsManager,
  CiSettingsUpdate,
} from "@cloudigniter/core/types";
import type { CiNextAwsSettingsManagerOptions } from "@ci-next/types";

function unwrap(response: CiGraphQLResponse): unknown {
  const result = ciParseGraphqlResponse(response, true);
  if (!result.ok) {
    const body = result.body as { error?: unknown } | undefined;
    throw new Error(
      typeof body?.error === "string"
        ? body.error
        : "Unable to load or save settings. Check the deployed Settings backend.",
    );
  }
  return result.body;
}

/** The backend resolves tenant copies and enforcement once; transport preserves that effective snapshot. */
export function ciCreateNextAwsSettingsManager({
  operations,
  provisioned = true,
  ...options
}: CiNextAwsSettingsManagerOptions): CiSettingsManager {
  const target = ciParseSettingsTarget(options.target);
  const targetInput = target.scope === "system" ? {} : { target };
  if (!provisioned) {
    const unavailable = async (): Promise<never> => {
      throw new Error("Deploy the Settings backend before saving settings.");
    };
    return ciCreateSettingsManager({
      ...options,
      store: {
        get: async () => null,
        initialize: async (input) => ({ ...input, revision: 0 }),
        set: unavailable,
        setMany: unavailable,
        delete: unavailable,
      },
    });
  }
  function decode(
    value: unknown,
    id: string,
    expectedRevision?: number,
  ): CiSettingsGroup {
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error("The settings backend returned an invalid save result.");
    const input = value as CiSettingsGroup;
    const entry = options.registry.get(id);
    if (
      input.id !== id ||
      input.scope !== entry.scope ||
      !input.value ||
      !Number.isSafeInteger(input.revision) ||
      input.revision < 0 ||
      (expectedRevision !== undefined &&
        input.revision !== expectedRevision + 1)
    )
      throw new Error("The settings backend returned an invalid save result.");
    if (
      target.scope !== "system" &&
      entry.scope !== "user" &&
      (!Number.isSafeInteger(input.systemRevision) ||
        input.systemRevision! < 0 ||
        !Array.isArray(input.lockedFields) ||
        input.lockedFields.some((field) => typeof field !== "string"))
    )
      throw new Error(
        "The settings backend does not support tenant settings. Deploy the updated backend.",
      );
    return {
      ...input,
      title: entry.meta?.title ?? id,
      description: entry.meta?.description,
      fields: entry.fields ?? [],
      value: entry.schema ? entry.schema.parse(input.value) : input.value,
      alwaysLoad: entry.alwaysLoad === true,
      ...(input.enforcement !== undefined
        ? { enforcement: ciParseSettingsEnforcement(input.enforcement, entry) }
        : {}),
    };
  }
  async function access(scope: string, action: "read" | "update") {
    if (!options.actor.authenticated || !options.actor.id)
      throw new Error("Sign in to manage settings.");
    if (scope !== "user" && !(await options.canManage(action, target)))
      throw new Error("Settings management access is required.");
  }
  async function read(id: string, manage = false) {
    const entry = options.registry.get(id);
    if (
      entry.scope !== "public" &&
      (!options.actor.authenticated || !options.actor.id)
    )
      throw new Error("Sign in to access private or personal settings.");
    return decode(
      unwrap(
        await operations.get(
          { id, ...targetInput, ...(manage ? { manage: true } : {}) },
          options.actor.authenticated,
        ),
      ),
      id,
    );
  }
  async function validate(updates: readonly CiSettingsUpdate[]) {
    if (!Array.isArray(updates) || !updates.length)
      throw new Error("Provide at least one settings group.");
    const scope = options.registry.get(updates[0]!.id).scope;
    await access(scope, "update");
    if (new Set(updates.map((item) => item.id)).size !== updates.length)
      throw new Error("Duplicate settings group.");
    for (const update of updates) {
      const entry = options.registry.get(update.id);
      if (entry.scope !== scope)
        throw new Error("Save one settings category at a time.");
      if (!Number.isSafeInteger(update.revision) || update.revision < 0)
        throw new Error("Invalid settings revision.");
      if (!entry.schema)
        throw new Error("A settings validation schema is required.");
      entry.schema.parse(update.value);
    }
  }
  function decodeMany(
    value: unknown,
    inputs: readonly { id: string; revision?: number }[],
  ) {
    const groups =
      value && typeof value === "object" && "groups" in value
        ? value.groups
        : undefined;
    if (!Array.isArray(groups) || groups.length !== inputs.length)
      throw new Error(
        "The settings backend returned an incomplete save result.",
      );
    return inputs.map((input) =>
      decode(
        groups.find((group) => group?.id === input.id),
        input.id,
        input.revision,
      ),
    );
  }
  return {
    read,
    async list(scope) {
      await access(scope, "read");
      const groups = await Promise.all(
        Object.keys(options.registry.listByScope(scope)).map((id) =>
          read(id, true),
        ),
      );
      return groups.sort(
        (a, b) =>
          (options.registry.get(a.id).meta?.order ?? 0) -
            (options.registry.get(b.id).meta?.order ?? 0) ||
          a.title.localeCompare(b.title),
      );
    },
    async save(id, value, revision, extra) {
      const input = { id, value, revision, ...extra };
      await validate([input]);
      return decode(
        unwrap(await operations.set({ ...input, ...targetInput })),
        id,
        revision,
      );
    },
    async saveAll(updates) {
      await validate(updates);
      if (!operations.setMany)
        throw new Error(
          "The settings backend does not support saving a complete form.",
        );
      return decodeMany(
        unwrap(await operations.setMany({ groups: updates, ...targetInput })),
        updates,
      );
    },
    async overwrite(selection) {
      if (
        !options.actor.authenticated ||
        !options.actor.id ||
        !(await options.canManage("overwrite", { scope: "system" }))
      )
        throw new Error("System settings overwrite permission is required.");
      if (target.scope === "system" || !operations.overwrite)
        throw new Error("Select a supported tenant overwrite target.");
      return decodeMany(
        unwrap(await operations.overwrite({ selection, target })),
        selection,
      );
    },
    loadRequest: (ids, cookies) =>
      ciResolveRequestSettings(
        options.registry,
        options.actor,
        read,
        ids,
        cookies,
      ),
  };
}
