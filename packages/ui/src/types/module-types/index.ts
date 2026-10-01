import type {
  CiExtensionCatalog,
  CiExtensionCommand,
  CiExtensionConfiguration,
  CiResult,
  CiExtensionStatus,
} from "@cloudigniter/core/types";

export type CiModuleManagementMessages = {
  title: string;
  description: string;
  badge: string;
  refresh: string;
  working: string;
  refreshError: string;
  operationErrorTitle: string;
  requestError: string;
  installRequested: string;
  uninstallRequested: string;
  saved: string;
  pending: string;
  empty: string;
  missingSource: string;
  incompatible: string;
  backendRequired: string;
  resourceDetails: string;
  provider: string;
  infrastructureId: string;
  permissions: string;
  install: string;
  retryInstall: string;
  enable: string;
  disable: string;
  open: string;
  settings: string;
  update: string;
  uninstall: string;
  retryUninstall: string;
  disableFirst: string;
  coreTitle: string;
  coreDescription: string;
  moduleFallback: string;
  uninstallDescription: string;
  confirmUninstall: string;
  cancel: string;
  dismissAlert: string;
  updateTitle: string;
  updateDescription: string;
  gotIt: string;
  settingsDescription: string;
  saveSettings: string;
  extensionCount(count: number): string;
  installedVersion(version: string): string;
  uninstallTitle(name: string): string;
  confirmationPrompt(id: string): string;
  settingsTitle(name: string): string;
  status: Record<CiExtensionStatus | "not-installed", string>;
  coreModuleNames: Record<string, string>;
};

export type CiModuleManagementPageProps = {
  /** Framework-neutral copy overrides; Next supplies these from route messages. */
  messages?: Partial<CiModuleManagementMessages>;
  /** Explicit locale for sorting translated labels. Defaults to en. */
  locale?: string;
  initialCatalog: CiExtensionCatalog;
  initialError?: string;
  onReload(): Promise<CiResult<CiExtensionCatalog>>;
  onCommand(command: CiExtensionCommand): Promise<CiResult<CiExtensionCatalog>>;
  moduleHref?: (id: string) => string;
};
export type CiExtensionPageProps = {
  configuration: CiExtensionConfiguration;
  execute(input: unknown): Promise<CiResult<unknown>>;
};
