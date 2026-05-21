import { ciErrorResult } from "@cloudigniter/core";
import type { CiErrorStatus, CiResult } from "@cloudigniter/core/types";

type CiCognitoErrorStatus = Extract<
  CiErrorStatus,
  400 | 403 | 404 | 409 | 429 | 500
>;

type CiAwsLikeError = Error & {
  name?: string;
  message?: string;
  Code?: string;
  __type?: string;
  $metadata?: unknown;
};

function ciBuildCognitoErrorResult<Ok = never>(
  statusCode: CiCognitoErrorStatus,
  message: string,
  error: CiAwsLikeError,
): CiResult<Ok> {
  const awsCode = error.name || error.Code || error.__type;

  return ciErrorResult<Ok>(
    statusCode,
    {
      message,
      code: awsCode,
      raw: error,
    },
    {
      originalMessage: error.message,
      awsErrorName: error.name,
      awsErrorCode: error.Code,
      awsErrorType: error.__type,
    },
  );
}

/**
 * Maps AWS Cognito exceptions into CloudIgniter error results.
 */
export function ciMapCognitoError<Ok = never>(error: unknown): CiResult<Ok> {
  if (error instanceof Error) {
    const awsError = error as CiAwsLikeError;
    const awsCode = awsError.name || awsError.Code || awsError.__type;

    switch (awsCode) {
      case "UserNotFoundException":
        return ciBuildCognitoErrorResult<Ok>(404, "User not found", awsError);

      case "UsernameExistsException":
        return ciBuildCognitoErrorResult<Ok>(
          409,
          "User already exists",
          awsError,
        );

      case "InvalidParameterException":
        return ciBuildCognitoErrorResult<Ok>(
          400,
          awsError.message || "Invalid input",
          awsError,
        );

      case "NotAuthorizedException":
        return ciBuildCognitoErrorResult<Ok>(
          403,
          "Not authorized to perform this action",
          awsError,
        );

      case "TooManyRequestsException":
        return ciBuildCognitoErrorResult<Ok>(
          429,
          "Too many requests",
          awsError,
        );

      case "CodeDeliveryFailureException":
        return ciBuildCognitoErrorResult<Ok>(
          500,
          "Failed to deliver Cognito verification message",
          awsError,
        );

      case "InternalErrorException":
        return ciBuildCognitoErrorResult<Ok>(
          500,
          "Cognito internal error",
          awsError,
        );

      default:
        return ciBuildCognitoErrorResult<Ok>(
          500,
          awsError.message || "Unknown Cognito error",
          awsError,
        );
    }
  }

  return ciErrorResult<Ok>(500, {
    message: "Unknown Cognito error",
    raw: error,
  });
}
