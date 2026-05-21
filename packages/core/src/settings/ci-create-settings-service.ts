import { ciMergeSettings } from "./ci-merge-settings";
import type {
  CiCreateSettingsServiceInput,
  CiDeleteSettingsInput,
  CiGetSettingsInput,
  CiSetSettingsInput,
  CiSettings,
  CiSettingsScope,
  CiSettingsService,
} from "@/types";

export function ciCreateSettingsService({
  registry,
  store,
}: CiCreateSettingsServiceInput): CiSettingsService {
  return {
    async get<TSettings extends CiSettings = CiSettings>(
      input: CiGetSettingsInput,
    ) {
      const entry = registry.get(input.settingsId);
      const scope = entry.scope;

      const system = await store.get<TSettings>({
        settingsId: input.settingsId,
        scope,
        targetTenantScope: "system",
      });

      const global = await store.get<TSettings>({
        settingsId: input.settingsId,
        scope,
        targetTenantScope: "global",
      });

      const tenant = input.tenantId
        ? await store.get<TSettings>({
            settingsId: input.settingsId,
            scope,
            targetTenantScope: "tenant",
            tenantId: input.tenantId,
          })
        : null;

      const user =
        scope === "user" && input.userId
          ? await store.get<TSettings>({
              settingsId: input.settingsId,
              scope,
              targetTenantScope: input.tenantId ? "tenant" : "system",
              tenantId: input.tenantId,
              userId: input.userId,
            })
          : null;

      const value = ciMergeSettings<TSettings>(
        entry.defaults as TSettings,
        system?.value,
        global?.value,
        tenant?.value,
        user?.value,
      );

      if (entry.schema) {
        entry.schema.parse(value);
      }

      return {
        settingsId: input.settingsId,
        scope,
        defaults: entry.defaults as TSettings,
        value,
        layers: {
          system,
          global,
          tenant,
          user,
        },
      };
    },

    async set<TSettings extends CiSettings = CiSettings>(
      input: CiSetSettingsInput<TSettings>,
    ) {
      const entry = registry.get(input.settingsId);
      const scope = ciResolveSettingsScope(input.scope, entry.scope);

      if (entry.schema) {
        const merged = ciMergeSettings<TSettings>(
          entry.defaults as TSettings,
          input.value,
        );

        entry.schema.parse(merged);
      }

      return store.set<TSettings>({
        settingsId: input.settingsId,
        scope,
        targetTenantScope: input.targetTenantScope,
        tenantId: input.tenantId,
        userId: input.userId,
        value: input.value,
      });
    },

    async delete(input: CiDeleteSettingsInput) {
      const entry = registry.get(input.settingsId);
      const scope = ciResolveSettingsScope(input.scope, entry.scope);

      await store.delete({
        settingsId: input.settingsId,
        scope,
        targetTenantScope: input.targetTenantScope,
        tenantId: input.tenantId,
        userId: input.userId,
      });
    },
  };
}

function ciResolveSettingsScope(
  requestedScope: CiSettingsScope | undefined,
  registryScope: CiSettingsScope,
): CiSettingsScope {
  if (!requestedScope) return registryScope;

  if (requestedScope !== registryScope) {
    throw new Error(
      `Settings scope mismatch. Requested "${requestedScope}" but registry defines "${registryScope}".`,
    );
  }

  return requestedScope;
}
