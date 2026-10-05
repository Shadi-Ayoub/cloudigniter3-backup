import type { CiRepositoryProject } from "./repositories.mjs";
export interface PublisherMetadata {
  schemaVersion: 1;
  label?: string;
  kind?: "package" | "app" | "template" | "website" | "docs";
  project?: string;
  workspaceName?: string;
  buildDirectories?: string[];
  assets?: boolean;
  staticHosting?: boolean;
  commands?: Record<
    string,
    { label: string; command: "node" | "bash" | "pnpm"; args: string[] }
  >;
}
export interface PublisherTarget {
  id: string;
  label: string;
  name: string;
  version: string;
  kind: string;
  private: boolean;
  description: string;
  scripts: Record<string, string>;
  metadata: PublisherMetadata;
  projectId: string | null;
  repository: CiRepositoryProject | null;
  access: string | null;
  exportMode: string;
  governedBuild: boolean;
  buildDirectories: string[];
  warnings: string[];
}
export interface PublisherCommand {
  command: string;
  args: string[];
  cwd: string;
  env?: Record<string, string>;
}
export interface PublisherAction {
  id: string;
  label: string;
  group: string;
  fields?: string[];
  remote?: boolean;
  description?: string;
}
export interface PublisherPlan {
  target: string;
  action: string;
  label: string;
  profile: string | null;
  destination: string;
  remote: boolean;
  commands: PublisherCommand[];
}
export interface PublisherJob extends PublisherPlan {
  id: string;
  status: "running" | "succeeded" | "failed" | "cancelled";
  startedAt: string;
  finishedAt?: string;
  exitCode?: number;
  log: string;
}
