import type {
  Config,
  NewChangeset,
  PreState,
  ReleasePlan,
} from "@changesets/types";

export type Access = "public" | "restricted";
export interface ReleasePolicy {
  schemaVersion: 1;
  repository: string | null;
  baseBranch: string;
  registry: string;
  reviewers: string[];
  tags: string[];
  topology?: "paired";
  packages: Record<
    string,
    {
      path: string;
      access: Access;
      sourceRepository?: string;
      buildRepository?: string;
    }
  >;
}
export interface PlanOptions {
  intent?: string;
  packages?: string[];
  changed?: boolean;
  summary?: string;
  tag?: string;
  preid?: string;
  access?: string;
}
export interface PlannedRelease {
  name: string;
  path: string;
  type: "major" | "minor" | "patch" | "none";
  oldVersion: string;
  newVersion: string;
  access: Access;
  reason: "requested" | "pending-changeset" | "dependency";
}
export interface ReleaseProposal {
  schemaVersion: 1;
  repository: string | null;
  baseBranch: string;
  registry: string;
  tag: string;
  summary: string;
  intent: string;
  releases: PlannedRelease[];
  changesetIds: string[];
  newChangeset: NewChangeset | null;
  enterPreState: PreState | null;
  warnings: string[];
  destinations?: Array<{
    name: string;
    sourceRepository: string;
    buildRepository: string;
  }>;
}
export interface ProcessOptions {
  input?: string;
  timeout?: number;
  env?: NodeJS.ProcessEnv;
  interactive?: boolean;
}
export type Runner = (
  command: string,
  args: string[],
  cwd: string,
  options?: ProcessOptions
) => Promise<string>;
export type { Config, NewChangeset, PreState, ReleasePlan };
export type MaintainerFlags = {
  workspaceRoot?: string;
  mode?: string;
  obfuscation?: string;
  target?: string;
  root?: string;
  style?: string;
  kind?: string;
  check?: boolean;
  clear?: boolean;
  scope?: string;
  watch?: boolean;
  coverage?: boolean;
  filter?: string[];
  interactive: boolean;
  verbose?: boolean;
};
