import type {
  CiExtensionManager,
  CiExtensionManagerOptions,
  CiExtensionSnapshot,
  CiExtensionCatalog,
  CiExtensionInstallation,
} from "@ci-core/types";
import {
  ciIsExtensionCompatible,
  ciResolveExtensionConfiguration,
  ciValidateExtensionManifest,
} from "./ci-extension-catalog";

/** Provider-neutral lifecycle. One revision serializes changes, including dependency checks. */
export function ciCreateExtensionManager(
  options: CiExtensionManagerOptions,
): CiExtensionManager {
  const manifests = new Map(
    options.manifests.map((manifest) => {
      ciValidateExtensionManifest(manifest);
      return [manifest.id, manifest] as const;
    }),
  );
  if (manifests.size !== options.manifests.length || manifests.size > 100)
    throw new Error("Duplicate extensions or catalogue limit exceeded (100).");
  const now = options.now ?? (() => new Date().toISOString());
  function catalog(snapshot: CiExtensionSnapshot): CiExtensionCatalog {
    const ids = new Set([
      ...manifests.keys(),
      ...Object.keys(snapshot.installations),
    ]);
    return {
      revision: snapshot.revision,
      entries: [...ids]
        .map((id) => {
          const installation = snapshot.installations[id];
          const manifest = manifests.get(id) ?? installation!.manifest;
          return {
            manifest,
            detected: manifests.has(id),
            compatible: ciIsExtensionCompatible(manifest, options.host),
            ...(installation ? { installation } : {}),
          };
        })
        .sort((a, b) => a.manifest.name.localeCompare(b.manifest.name)),
    };
  }
  async function save(snapshot: CiExtensionSnapshot) {
    const next = { ...snapshot, revision: snapshot.revision + 1 };
    await options.store.write(next, snapshot.revision);
    return next;
  }
  async function reconcile(snapshot: CiExtensionSnapshot) {
    let changed = false;
    for (const [id, record] of Object.entries(snapshot.installations)) {
      if (record.status !== "installing" && record.status !== "uninstalling")
        continue;
      const state = await options.provider.inspect(record);
      if (record.status === "uninstalling" && state.status === "missing") {
        delete snapshot.installations[id];
        changed = true;
        continue;
      }
      if (
        state.infrastructure &&
        JSON.stringify(state.infrastructure) !==
          JSON.stringify(record.infrastructure)
      ) {
        record.infrastructure = state.infrastructure;
        changed = true;
      }
      if (
        state.status === "failed" ||
        (record.status === "installing" && state.status === "ready")
      ) {
        record.status = state.status === "ready" ? "disabled" : "failed";
        record.error = state.error;
        record.updatedAt = now();
        changed = true;
      }
    }
    return changed ? save(snapshot) : snapshot;
  }
  return {
    async list() {
      await options.authorize();
      return catalog(await reconcile(await options.store.read()));
    },
    async execute(command) {
      const actorId = await options.authorize();
      if (
        !command ||
        !Number.isSafeInteger(command.revision) ||
        command.revision < 0
      )
        throw new Error("Invalid module revision.");
      let snapshot = await options.store.read();
      if (snapshot.revision !== command.revision)
        throw new Error("Modules changed. Refresh and try again.");
      const record = snapshot.installations[command.id];
      const detected = manifests.get(command.id);
      const manifest = detected ?? record?.manifest;
      if (!manifest)
        throw new Error("Unknown extension. Core modules cannot be changed.");
      ciValidateExtensionManifest(manifest);
      const dependents = Object.values(snapshot.installations).filter(
        (item) =>
          item.manifest.id !== command.id &&
          item.manifest.dependencies?.some(
            (dep) => dep.id === command.id && !dep.optional,
          ),
      );
      const requireDependencies = () => {
        for (const dependency of manifest.dependencies ?? []) {
          if (dependency.optional) continue;
          const required = snapshot.installations[dependency.id];
          if (!required || required.status !== "enabled")
            throw new Error(`Enable required module ${dependency.id} first.`);
        }
      };
      let effect: "install" | "uninstall" | undefined;
      switch (command.action) {
        case "install": {
          if (!detected || !ciIsExtensionCompatible(manifest, options.host))
            throw new Error(
              "Module is missing or incompatible with this host.",
            );
          requireDependencies();
          if (record && record.status !== "installing")
            throw new Error(
              "Module is already installed. Uninstall a failed installation before reinstalling.",
            );
          snapshot.installations[command.id] = record ?? {
            manifest,
            status: "installing",
            operation: "install",
            operationId: options.createOperationId(),
            infrastructure: options.provider.plan(manifest),
            configuration: ciResolveExtensionConfiguration(manifest),
            updatedAt: now(),
            updatedBy: actorId,
          };
          effect = "install";
          break;
        }
        case "uninstall": {
          if (!record) throw new Error("Module is not installed.");
          if (command.confirmation !== command.id)
            throw new Error(
              "Type the exact module ID to confirm permanent deletion of its resources and data.",
            );
          if (record.status === "enabled" || record.status === "installing")
            throw new Error(
              "Disable the module or wait for installation to finish before uninstalling.",
            );
          if (dependents.length)
            throw new Error(
              `Uninstall dependent modules first: ${dependents.map((item) => item.manifest.id).join(", ")}.`,
            );
          if (record.status !== "uninstalling")
            record.operationId = options.createOperationId();
          record.status = "uninstalling";
          record.operation = "uninstall";
          effect = "uninstall";
          break;
        }
        case "enable":
          if (!record || record.status !== "disabled")
            throw new Error(
              "Only a successfully installed, disabled module can be enabled.",
            );
          if (
            !detected ||
            detected.version !== record.manifest.version ||
            !ciIsExtensionCompatible(detected, options.host)
          )
            throw new Error(
              "Installed module code is missing, incompatible, or has a different version. Updates are not supported yet.",
            );
          requireDependencies();
          record.status = "enabled";
          break;
        case "disable":
          if (!record || record.status !== "enabled")
            throw new Error("Module is not enabled.");
          if (
            dependents.some(
              (item) =>
                item.status === "enabled" || item.status === "installing",
            )
          )
            throw new Error("Disable dependent modules first.");
          record.status = "disabled";
          break;
        case "configure":
          if (!record || !["enabled", "disabled"].includes(record.status))
            throw new Error("Install the module before configuring it.");
          record.configuration = ciResolveExtensionConfiguration(
            record.manifest,
            command.configuration,
          );
          break;
        default:
          throw new Error(
            "Unsupported module action. Updates are not available yet.",
          );
      }
      const changed = snapshot.installations[command.id]!;
      changed.updatedAt = now();
      changed.updatedBy = actorId;
      delete changed.error;
      // Persist the operation intent before touching provider resources. Retrying uses the same operation ID.
      snapshot = await save(snapshot);
      if (effect) await options.provider[effect](changed);
      return catalog(snapshot);
    },
  };
}
