import { ciRunPackageTests } from "../../package-workflows.mjs";
import {
  CiDevUsageError,
  CiDevWorkerError,
  ciErrorMessage,
} from "../../runtime.mjs";

try {
  await ciRunPackageTests(process.cwd());
} catch (error) {
  console.error(ciErrorMessage(error));
  process.exitCode =
    error instanceof CiDevUsageError
      ? 2
      : error instanceof CiDevWorkerError
        ? error.exitCode
        : 1;
}
