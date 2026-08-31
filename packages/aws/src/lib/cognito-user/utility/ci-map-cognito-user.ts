import type {
  AttributeType,
  UserType,
} from "@aws-sdk/client-cognito-identity-provider";
import type { CICognitoUser } from "@ci-aws/types";

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
export function ciMapCognitoUser(user: UserType): CICognitoUser {
  const attributes = attributesToRecord(user.Attributes);
  const username = user.Username ?? attributes.email ?? attributes.sub ?? "";

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
    ...(user.UserCreateDate
      ? { createdAt: user.UserCreateDate.toISOString() }
      : {}),
    ...(user.UserLastModifiedDate
      ? { updatedAt: user.UserLastModifiedDate.toISOString() }
      : {}),
  };
}
