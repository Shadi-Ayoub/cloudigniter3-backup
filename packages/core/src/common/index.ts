// error helpers
export { ciSerializeUnknownError } from "./error";

// error types

// result
export {
  ciErrorResult,
  ciError400,
  ciError401,
  ciError403,
  ciError404,
  ciError500,
  ciIsErrorResult,
  ciIsOkResult,
  ciOkResult,
  ciOk200,
} from "./result";

// result
export type {
  CiErrorBody,
  CiErrorPayload,
  CiErrorSeverity,
  CiErrorStatus,
  CiJsonPrimitive,
  CiJsonValue,
  CiOkStatus,
  CiResult,
} from "./result";
