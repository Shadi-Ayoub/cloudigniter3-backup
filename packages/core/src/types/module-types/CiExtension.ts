import type {
  CiModuleManifest,
  CiModuleHost,
  CiResourceDeletionMetadata,
} from "@ci-core/types";

export type CiExtensionConfiguration = Record<
  string,
  string | number | boolean
>;
export type CiExtensionSetting = {
  readonly key: string;
  readonly title: string;
  readonly default: string | boolean;
  readonly options?: readonly string[];
};
/** An optional, independently installed module; existing runtime manifests remain valid. */
export type CiExtensionManifest = CiModuleManifest & {
  readonly kind: "extension";
  readonly version: string;
  readonly settings?: readonly CiExtensionSetting[];
  readonly permissions?: readonly {
    readonly id: string;
    readonly title: string;
    readonly accessMode: "read" | "write";
  }[];
  /** Adds the module's default user role for authenticated actors; ownership checks remain mandatory. */
  readonly authenticatedAccess?: boolean;
  readonly dashboard?: {
    readonly title: string;
    readonly description?: string;
  };
};
export type CiExtensionStatus =
  "installing" | "disabled" | "enabled" | "uninstalling" | "failed";
export type CiExtensionInfrastructure = {
  provider: string;
  /** Provider-owned resource identity, for example an AWS CloudFormation stack ARN. */
  id: string;
  outputs?: Record<string, string>;
};
export type CiExtensionInstallation = {
  manifest: CiExtensionManifest;
  status: CiExtensionStatus;
  operation: "install" | "uninstall";
  operationId: string;
  infrastructure: CiExtensionInfrastructure;
  configuration: CiExtensionConfiguration;
  updatedAt: string;
  updatedBy: string;
  error?: string;
};
export type CiExtensionSnapshot = {
  revision: number;
  installations: Record<string, CiExtensionInstallation>;
};
export type CiExtensionCatalogEntry = {
  manifest: CiExtensionManifest;
  detected: boolean;
  compatible: boolean;
  backendAvailable?: boolean;
  installation?: CiExtensionInstallation;
};
export type CiExtensionCommand = {
  id: string;
  action: "install" | "uninstall" | "enable" | "disable" | "configure";
  revision: number;
  /** Exact module ID; required again at the authoritative destructive boundary. */
  confirmation?: string;
  configuration?: CiExtensionConfiguration;
};
export type CiExtensionStore = {
  read(): Promise<CiExtensionSnapshot>;
  /** Atomically fails if the persisted revision differs. */
  write(snapshot: CiExtensionSnapshot, expectedRevision: number): Promise<void>;
};
export type CiExtensionInfrastructureState = {
  status: "missing" | "pending" | "ready" | "failed";
  infrastructure?: CiExtensionInfrastructure;
  error?: string;
};
export type CiExtensionProvider = {
  plan(manifest: CiExtensionManifest): CiExtensionInfrastructure;
  install(installation: CiExtensionInstallation): Promise<void>;
  uninstall(installation: CiExtensionInstallation): Promise<void>;
  inspect(
    installation: CiExtensionInstallation,
  ): Promise<CiExtensionInfrastructureState>;
};
export type CiExtensionManagerOptions = {
  manifests: readonly CiExtensionManifest[];
  host: CiModuleHost;
  store: CiExtensionStore;
  provider: CiExtensionProvider;
  /** Must use trusted identity and repeat the developer/environment gate. */
  authorize(): Promise<string>;
  createOperationId(): string;
  now?: () => string;
};
export type CiExtensionCatalog = {
  revision: number;
  entries: CiExtensionCatalogEntry[];
};
export type CiExtensionManager = {
  list(): Promise<CiExtensionCatalog>;
  execute(command: CiExtensionCommand): Promise<CiExtensionCatalog>;
};

export type CiTodoItem = {
  id: string;
  title: string;
  notes: string;
  completed: boolean;
  priority: "low" | "normal" | "high";
  dueDate: string | null;
  deleted: boolean;
  deletion?: CiResourceDeletionMetadata;
  revision: number;
  createdAt: string;
  updatedAt: string;
};
export type CiTodoPage = { items: CiTodoItem[]; nextToken?: string };
export type CiTodoCommand =
  | { action: "list"; nextToken?: string }
  | {
      action: "create";
      item: Pick<CiTodoItem, "title" | "notes" | "priority" | "dueDate">;
    }
  | { action: "save"; item: CiTodoItem };
