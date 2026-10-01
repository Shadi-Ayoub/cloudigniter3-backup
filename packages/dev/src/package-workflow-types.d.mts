export interface CiPackageWorkflowConfig {
  schemaVersion: 1;
  typecheck?: ("source" | "tools" | "tests")[];
  test?: {
    files: string[];
    typescript?: boolean;
    tsconfig?: string;
    timeout?: number;
    requireNoSkipped?: boolean;
  };
  beforeBuild?: string;
  coverageCheck?: string;
  packageCheck?: string;
  releaseCheck?: string;
  assets?: boolean;
  check?: CiPackageCheckStep[];
  quality?: CiPackageCheckStep[];
  prepublish?: (CiPackageCheckStep | "quality" | "check")[];
}
export type CiPackageCheckStep =
  | "typecheck"
  | "typecheck-tools"
  | "typecheck-tests"
  | "test"
  | "test-coverage"
  | "test-build-gate"
  | "check-package"
  | "check";
