import type {
  CiExtensionCatalog,
  CiExtensionCommand,
  CiExtensionConfiguration,
  CiExtensionManifest,
  CiGraphQLResponse,
  CiModuleHost,
  CiResult,
} from "@cloudigniter/core/types";
import type { CiNextContext } from "@ci-next/types";

export type CiNextEnabledExtension = {
  manifest: CiExtensionManifest;
  configuration: CiExtensionConfiguration;
};
export type CiNextExtensionClientOptions = {
  context: Pick<CiNextContext, "auth" | "env">;
  manifests: readonly CiExtensionManifest[];
  host: CiModuleHost;
  operations: {
    manage?: (input: Record<string, unknown>) => Promise<CiGraphQLResponse>;
    execute?: (input: Record<string, unknown>) => Promise<CiGraphQLResponse>;
  };
};
export type CiNextExtensionClient = {
  list(): Promise<CiResult<CiExtensionCatalog>>;
  command(command: CiExtensionCommand): Promise<CiResult<CiExtensionCatalog>>;
  enabled(): Promise<CiResult<CiNextEnabledExtension[]>>;
  execute(id: string, input: unknown): Promise<CiResult<unknown>>;
  detected(): CiExtensionCatalog;
};
