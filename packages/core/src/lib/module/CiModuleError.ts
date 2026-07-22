import type { CiModuleErrorCode, CiModuleId } from "@ci-core/types";

export class CiModuleError extends Error {
  readonly code: CiModuleErrorCode;
  readonly moduleId?: CiModuleId;

  constructor(input: {
    code: CiModuleErrorCode;
    message: string;
    moduleId?: CiModuleId;
    cause?: unknown;
  }) {
    super(input.message, {
      cause: input.cause,
    });

    this.name = "CiModuleError";
    this.code = input.code;
    this.moduleId = input.moduleId;
  }
}
