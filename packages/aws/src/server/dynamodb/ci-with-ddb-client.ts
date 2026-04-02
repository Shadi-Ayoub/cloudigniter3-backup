import {
  ciErrorResult,
  type CiErrorBody,
  type CiErrorStatus,
  type CiResult,
} from "@cloudigniter/core";
import { ciNormalizeThrownError } from "@cloudigniter/core/server";
import { Dynamodb } from "./";

/**
 * Executes a callback only after a Dynamodb wrapper has been initialized successfully.
 *
 * Purpose:
 * - remove repeated `initialize()` boilerplate
 * - keep service functions concise
 * - preserve Result-style failure handling
 *
 * Notes:
 * - the callback receives the initialized `ddb` instance
 * - the caller still owns `ddb.destroy()`
 */
export async function ciWithDdbClient<Ok>(
  ddb: Dynamodb,
  run: (
    ddb: Dynamodb,
  ) => Promise<CiResult<Ok, CiErrorBody, 200, CiErrorStatus>>,
): Promise<CiResult<Ok, CiErrorBody, 200, CiErrorStatus>> {
  try {
    const init = await ddb.initialize();

    if (!init.ok) {
      return ciErrorResult(init.statusCode, init.body.error, init.body.details);
    }

    return await run(ddb);
  } catch (error) {
    const ciError = ciNormalizeThrownError(error);
    return ciErrorResult(500, ciError.message);
  } finally {
    ddb.destroy();
  }
}
