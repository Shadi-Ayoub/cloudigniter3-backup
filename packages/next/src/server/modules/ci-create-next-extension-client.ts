import {
  ciCanAccessDeveloperTools,
  ciIsExtensionCompatible,
  ciParseGraphqlResponse,
  ciValidateExtensionManifest,
} from "@cloudigniter/core/lib";
import type {
  CiExtensionCatalog,
  CiGraphQLResponse,
  CiResult,
} from "@cloudigniter/core/types";
import type {
  CiNextEnabledExtension,
  CiNextExtensionClient,
  CiNextExtensionClientOptions,
} from "@ci-next/types";

/** Next.js application/server-action boundary. The provider repeats every authoritative check. */
export function ciCreateNextExtensionClient(
  options: CiNextExtensionClientOptions,
): CiNextExtensionClient {
  const denied = (message: string) => ({
    ok: false as const,
    statusCode: 400 as const,
    body: { error: message },
  });
  function requireActor(developer = false) {
    if (!options.context.auth.user.authenticated)
      throw new Error("Sign in to use modules.");
    if (
      developer &&
      (!options.context.auth.user.roles.includes("developer") ||
        !ciCanAccessDeveloperTools({
          envMode: options.context.env.mode,
          actor: {
            authenticated: true,
            roles: options.context.auth.user.roles,
          },
        }))
    )
      throw new Error(
        "Module management requires a developer in development mode.",
      );
  }
  async function request<T>(
    operation: (() => Promise<CiGraphQLResponse>) | undefined,
    decode: (value: unknown) => T,
  ): Promise<CiResult<T>> {
    if (!operation)
      return denied(
        "Deploy the Modules backend and regenerate Amplify outputs before using this feature.",
      );
    try {
      const response = ciParseGraphqlResponse(await operation());
      if (!response.ok) return denied(response.body.error);
      return { ok: true, statusCode: 200, body: decode(response.body) };
    } catch (error) {
      return denied(
        error instanceof Error ? error.message : "Module request failed.",
      );
    }
  }
  const detected = (): CiExtensionCatalog => ({
    revision: 0,
    entries: options.manifests.map((manifest) => ({
      manifest,
      detected: true,
      compatible: ciIsExtensionCompatible(manifest, options.host),
      backendAvailable: false,
    })),
  });
  function catalog(value: unknown): CiExtensionCatalog {
    if (
      !value ||
      typeof value !== "object" ||
      !("revision" in value) ||
      !Number.isSafeInteger(value.revision) ||
      !("entries" in value) ||
      !Array.isArray(value.entries)
    )
      throw new Error("Invalid module catalogue response.");
    const result = value as CiExtensionCatalog;
    const entries = new Map(
      result.entries.map((entry) => {
        ciValidateExtensionManifest(entry.manifest);
        const local = options.manifests.find(
          (item) => item.id === entry.manifest.id,
        );
        return [
          entry.manifest.id,
          {
            ...entry,
            manifest: local ?? entry.manifest,
            detected: !!local,
            compatible: ciIsExtensionCompatible(
              local ?? entry.manifest,
              options.host,
            ),
            backendAvailable:
              !!local &&
              entry.compatible &&
              entry.manifest.version === local.version,
          },
        ];
      }),
    );
    for (const entry of detected().entries)
      if (!entries.has(entry.manifest.id))
        entries.set(entry.manifest.id, { ...entry, backendAvailable: false });
    return {
      revision: result.revision,
      entries: [...entries.values()].sort((a, b) =>
        a.manifest.name.localeCompare(b.manifest.name),
      ),
    };
  }
  return {
    detected,
    async list() {
      try {
        requireActor(true);
      } catch (error) {
        return denied((error as Error).message);
      }
      return request(
        options.operations.manage
          ? () => options.operations.manage!({ action: "list" })
          : undefined,
        catalog,
      );
    },
    async command(command) {
      try {
        requireActor(true);
      } catch (error) {
        return denied((error as Error).message);
      }
      return request(
        options.operations.manage
          ? () => options.operations.manage!({ ...command })
          : undefined,
        catalog,
      );
    },
    async enabled() {
      try {
        requireActor();
      } catch (error) {
        return denied((error as Error).message);
      }
      // Old application deployments have no extension endpoint yet; ordinary dashboards still work.
      if (!options.operations.execute)
        return { ok: true, statusCode: 200, body: [] };
      return request(
        () => options.operations.execute!({ action: "catalog" }),
        (value) => {
          if (!Array.isArray(value))
            throw new Error("Invalid enabled-module response.");
          return (value as CiNextEnabledExtension[]).filter((item) => {
            ciValidateExtensionManifest(item.manifest);
            return options.manifests.some(
              (local) =>
                local.id === item.manifest.id &&
                local.version === item.manifest.version &&
                ciIsExtensionCompatible(local, options.host),
            );
          });
        },
      );
    },
    async execute(id, input) {
      try {
        requireActor();
        if (!options.manifests.some((item) => item.id === id))
          throw new Error("Module code is not present in this application.");
      } catch (error) {
        return denied((error as Error).message);
      }
      return request(
        options.operations.execute
          ? () => options.operations.execute!({ id, input })
          : undefined,
        (value) => value,
      );
    },
  };
}
