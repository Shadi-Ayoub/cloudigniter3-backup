import { ciMapCognitoError } from "@ci-aws/lib";
import type {
  CICognitoUsersPage,
  CIListCognitoUsersInput,
} from "@ci-aws/types";
import { ciOk200 } from "@cloudigniter/core/lib";
import type { CiResult } from "@cloudigniter/core/types";
import { ciCreateCognitoClient, ciListCognitoUserGroups } from "./helpers";
import { ciMapCognitoUser } from "../utility/ci-map-cognito-user";

const COGNITO_GROUP_LOOKUP_CONCURRENCY = 5;

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

    const client = await cognito.getIdentityProviderClient();
    const cognitoUsers = result.body.Users ?? [];
    const users: CICognitoUsersPage["users"] = [];

    for (
      let offset = 0;
      offset < cognitoUsers.length;
      offset += COGNITO_GROUP_LOOKUP_CONCURRENCY
    ) {
      const batch = cognitoUsers.slice(
        offset,
        offset + COGNITO_GROUP_LOOKUP_CONCURRENCY,
      );
      users.push(
        ...(await Promise.all(
          batch.map(async (user) => {
            if (!user.Username) {
              throw new Error(
                "Cognito ListUsers returned a record without a username.",
              );
            }
            const groups = await ciListCognitoUserGroups(client, {
              userPoolId: input.userPoolId,
              username: user.Username,
            });
            return ciMapCognitoUser(user, groups);
          }),
        )),
      );
    }

    return ciOk200({
      users,
      ...(result.body.PaginationToken
        ? { paginationToken: result.body.PaginationToken }
        : {}),
    });
  } catch (error) {
    return ciMapCognitoError<CICognitoUsersPage>(error);
  }
}
