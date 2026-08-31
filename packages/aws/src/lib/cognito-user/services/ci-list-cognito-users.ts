import { ciMapCognitoError } from "@ci-aws/lib";
import type {
  CICognitoUsersPage,
  CIListCognitoUsersInput,
} from "@ci-aws/types";
import { ciOk200 } from "@cloudigniter/core/lib";
import type { CiResult } from "@cloudigniter/core/types";
import { ciCreateCognitoClient } from "./helpers";
import { ciMapCognitoUser } from "../utility/ci-map-cognito-user";

/** Lists one bounded Cognito page and normalizes its records. */
export async function ciListCognitoUsers(
  input: CIListCognitoUsersInput,
): Promise<CiResult<CICognitoUsersPage>> {
  try {
    const cognito = await ciCreateCognitoClient(input.clientConfig);
    const result = await cognito.listUsers({
      UserPoolId: input.userPoolId,
      Limit: Math.min(Math.max(input.limit ?? 60, 1), 60),
      ...(input.paginationToken
        ? { PaginationToken: input.paginationToken }
        : {}),
      ...(input.filter ? { Filter: input.filter } : {}),
    });
    if (!result.ok) return result;

    return ciOk200({
      users: (result.body.Users ?? []).map(ciMapCognitoUser),
      ...(result.body.PaginationToken
        ? { paginationToken: result.body.PaginationToken }
        : {}),
    });
  } catch (error) {
    return ciMapCognitoError<CICognitoUsersPage>(error);
  }
}
