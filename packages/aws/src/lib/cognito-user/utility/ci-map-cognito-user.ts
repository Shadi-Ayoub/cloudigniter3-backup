import type {
  AdminGetUserCommandOutput,
  AttributeType,
  GroupType,
  UserType,
} from "@aws-sdk/client-cognito-identity-provider";
import type { CICognitoUser, CICognitoUserGroup } from "@ci-aws/types";

/** Reserved Cognito group that identifies the single CloudIgniter Root User. */
export const CI_COGNITO_ROOT_USER_GROUP = "cloudigniter-root-user" as const;

function attributesToRecord(
  attributes: readonly AttributeType[] | undefined,
): Record<string, string> {
  return Object.fromEntries(
    (attributes ?? []).flatMap((attribute) =>
      attribute.Name && attribute.Value
        ? [[attribute.Name, attribute.Value] as const]
        : [],
    ),
  );
}

function userAttributes(
  user: UserType | AdminGetUserCommandOutput,
): readonly AttributeType[] | undefined {
  return "UserAttributes" in user
    ? user.UserAttributes
    : (user as UserType).Attributes;
}

function normalizeGroups(groups: readonly GroupType[]): CICognitoUserGroup[] {
  const groupsById = new Map<string, CICognitoUserGroup>();

  for (const group of groups) {
    const id = group.GroupName?.trim();
    if (!id || groupsById.has(id)) continue;

    groupsById.set(id, {
      id,
      ...(group.Precedence !== undefined
        ? { precedence: group.Precedence }
        : {}),
      ...(group.Description ? { description: group.Description } : {}),
    });
  }

  return [...groupsById.values()].sort((left, right) => {
    const precedenceDifference =
      (left.precedence ?? Number.POSITIVE_INFINITY) -
      (right.precedence ?? Number.POSITIVE_INFINITY);
    if (precedenceDifference !== 0) return precedenceDifference;
    return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
  });
}

function resolveIdentityProvider(attributes: Record<string, string>) {
  const identities = attributes.identities;
  if (identities) {
    try {
      const parsed: unknown = JSON.parse(identities);
      const first = Array.isArray(parsed) ? parsed[0] : undefined;
      if (
        typeof first === "object" &&
        first !== null &&
        "providerName" in first &&
        typeof first.providerName === "string"
      ) {
        return {
          id: first.providerName,
          label: first.providerName,
          kind: "federated" as const,
        };
      }
    } catch {
      // Malformed provider metadata must not make the user list unusable.
    }
  }

  return {
    id: "cognito-user-pool" as const,
    label: "Amazon Cognito",
    kind: "native" as const,
  };
}

/** Maps the AWS SDK record to CloudIgniter's stable Cognito contract. */
export function ciMapCognitoUser(
  user: UserType | AdminGetUserCommandOutput,
  groups: readonly GroupType[] = [],
): CICognitoUser {
  const attributes = attributesToRecord(userAttributes(user));
  const username = user.Username ?? attributes.email ?? attributes.sub ?? "";
  const normalizedGroups = normalizeGroups(groups);

  return {
    id: attributes.sub ?? username,
    username,
    enabled: user.Enabled ?? false,
    status: user.UserStatus ?? "UNKNOWN",
    ...(attributes.email ? { email: attributes.email } : {}),
    ...(attributes.email_verified
      ? { emailVerified: attributes.email_verified === "true" }
      : {}),
    ...(attributes.given_name ? { givenName: attributes.given_name } : {}),
    ...(attributes.middle_name ? { middleName: attributes.middle_name } : {}),
    ...(attributes.family_name ? { familyName: attributes.family_name } : {}),
    identityProvider: resolveIdentityProvider(attributes),
    attributes,
    isRootUser: normalizedGroups.some(
      (group) => group.id === CI_COGNITO_ROOT_USER_GROUP,
    ),
    groups: normalizedGroups.filter(
      (group) => group.id !== CI_COGNITO_ROOT_USER_GROUP,
    ),
    ...(user.UserCreateDate
      ? { createdAt: user.UserCreateDate.toISOString() }
      : {}),
    ...(user.UserLastModifiedDate
      ? { updatedAt: user.UserLastModifiedDate.toISOString() }
      : {}),
  };
}
