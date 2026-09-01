import "server-only";

import {
  CI_ROOT_USER_IDENTITY_GROUP,
  ciParseGraphqlResponse,
  ciResolvePrimaryRole,
} from "@cloudigniter/core/lib";
import type {
  CICreateUserInput,
  CIDeleteUserInput,
  CIPurgeUserInput,
  CIRestoreUserInput,
  CISetUserStatusInput,
  CIUpdateUserInput,
  CIUser,
  CIUserAssignment,
  CIUserProfile,
  CIUserStatusChange,
  CiResourceDeletionMetadata,
  CiSecurityStoredRoleAssignment,
} from "@cloudigniter/core/types";
import {
  ciDeserializeAwsJson,
  ciSerializeUserProfileAwsJsonFields,
} from "@cloudigniter/aws/lib";
import type {
  CICognitoUser,
  CICognitoUsersPage,
} from "@cloudigniter/aws/types";
import outputs from "@/../amplify_outputs.json";
import { appServerClient } from "../../app-server-client";

type UserProfileModel = {
  userId: string;
  username: string;
  email?: string | null;
  emailVerified?: boolean | null;
  displayName?: string | null;
  title?: string | null;
  givenName?: string | null;
  middleName?: string | null;
  familyName?: string | null;
  avatarUrl?: string | null;
  avatarKey?: string | null;
  phoneNumber?: string | null;
  locale?: string | null;
  timeZone?: string | null;
  bio?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  address?: unknown;
  extensions?: unknown;
  roles?: Array<string | null> | null;
  isRootUser?: boolean | null;
  status: string;
  statusChange?: unknown;
  deletionState: string;
  deletion?: unknown;
  createdAt?: string | null;
  updatedAt?: string | null;
};

function requireGraphqlOk<T>(
  response: ReturnType<typeof ciParseGraphqlResponse>,
): T {
  if (!response.ok) {
    const body = response.body as { error?: unknown; details?: unknown };
    throw new Error(
      typeof body.error === "string" ? body.error : "User request failed.",
    );
  }
  return response.body as T;
}

function assertNoModelErrors(
  errors: readonly { message?: string | null }[] | undefined,
): void {
  if (errors?.length) {
    const message = errors[0]?.message ?? "User Profile request failed.";
    if (
      message.includes("field that is not defined for input object type") ||
      message.includes("FieldUndefined")
    ) {
      throw new Error(
        `${message} The deployed Amplify UserProfile schema is older than this application. Deploy/regenerate the current backend outputs, then retry.`,
      );
    }
    throw new Error(message);
  }
}

function decodeDeletion(
  value: unknown,
): CiResourceDeletionMetadata | undefined {
  const decoded = ciDeserializeAwsJson(value);
  return typeof decoded === "object" &&
    decoded !== null &&
    "state" in decoded &&
    decoded.state === "deleted"
    ? (decoded as CiResourceDeletionMetadata)
    : undefined;
}

function decodeStatusChange(value: unknown): CIUserStatusChange | undefined {
  const decoded = ciDeserializeAwsJson(value);
  return typeof decoded === "object" &&
    decoded !== null &&
    "changedAt" in decoded &&
    typeof decoded.changedAt === "string" &&
    "changedBy" in decoded &&
    typeof decoded.changedBy === "string" &&
    "reason" in decoded &&
    typeof decoded.reason === "string"
    ? (decoded as CIUserStatusChange)
    : undefined;
}

function toProfile(record: UserProfileModel | undefined): CIUserProfile {
  if (!record) return {};
  const address = ciDeserializeAwsJson(record.address);
  const extensions = ciDeserializeAwsJson(record.extensions);
  return {
    ...(record.displayName ? { displayName: record.displayName } : {}),
    ...(record.title ? { title: record.title } : {}),
    ...(record.givenName ? { givenName: record.givenName } : {}),
    ...(record.middleName ? { middleName: record.middleName } : {}),
    ...(record.familyName ? { familyName: record.familyName } : {}),
    ...(record.avatarUrl ? { avatarUrl: record.avatarUrl } : {}),
    ...(record.avatarKey ? { avatarKey: record.avatarKey } : {}),
    ...(record.phoneNumber ? { phoneNumber: record.phoneNumber } : {}),
    ...(record.locale ? { locale: record.locale } : {}),
    ...(record.timeZone ? { timeZone: record.timeZone } : {}),
    ...(record.bio ? { bio: record.bio } : {}),
    ...(record.birthDate ? { birthDate: record.birthDate } : {}),
    ...(record.gender ? { gender: record.gender } : {}),
    ...(address && typeof address === "object" && !Array.isArray(address)
      ? { address: address as CIUserProfile["address"] }
      : {}),
    ...(extensions &&
    typeof extensions === "object" &&
    !Array.isArray(extensions)
      ? { extensions: extensions as Record<string, unknown> }
      : {}),
  };
}

function toAssignment(
  assignment: CiSecurityStoredRoleAssignment,
): CIUserAssignment {
  return {
    id: assignment.id,
    subjectId: assignment.subjectId,
    roleId: assignment.roleId,
    scope: assignment.scope,
    propagation: assignment.propagation,
    ...(assignment.validFrom ? { validFrom: assignment.validFrom } : {}),
    ...(assignment.expiresAt ? { expiresAt: assignment.expiresAt } : {}),
  };
}

function toUser(
  identity: CICognitoUser,
  record: UserProfileModel | undefined,
  assignments: readonly CiSecurityStoredRoleAssignment[],
  detailLevel: "summary" | "full" = "summary",
): CIUser<CICognitoUser> {
  const userAssignments = assignments
    .filter((assignment) => assignment.subjectId === identity.id)
    .map(toAssignment);
  const persistedRoles = (record?.roles ?? []).filter(
    (role): role is string => typeof role === "string",
  );
  const identityRoles = identity.groups
    .map((group) => group.id)
    .filter((role) => role !== CI_ROOT_USER_IDENTITY_GROUP);
  const roles = Array.from(
    new Set(identityRoles.length ? identityRoles : persistedRoles),
  );
  const storedProfile = toProfile(record);
  const profile: CIUserProfile = {
    ...storedProfile,
    ...(identity.givenName
      ? { givenName: identity.givenName }
      : storedProfile.givenName
        ? { givenName: storedProfile.givenName }
        : {}),
    ...(identity.middleName
      ? { middleName: identity.middleName }
      : storedProfile.middleName
        ? { middleName: storedProfile.middleName }
        : {}),
    ...(identity.familyName
      ? { familyName: identity.familyName }
      : storedProfile.familyName
        ? { familyName: storedProfile.familyName }
        : {}),
  };
  const isRootUser =
    identity.isRootUser === true || record?.isRootUser === true;
  const primaryRole = ciResolvePrimaryRole(roles);
  const displayName =
    profile.displayName?.trim() ||
    [
      profile.givenName ?? identity.givenName,
      profile.familyName ?? identity.familyName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    identity.email ||
    identity.username;
  const status = !identity.enabled
    ? "suspended"
    : identity.status === "FORCE_CHANGE_PASSWORD" ||
        identity.status === "UNCONFIRMED"
      ? "invited"
      : "active";
  const statusChange = decodeStatusChange(record?.statusChange);
  const deletion = decodeDeletion(record?.deletion);

  return {
    id: identity.id,
    username: identity.username,
    ...(identity.email ? { email: identity.email } : {}),
    ...(identity.emailVerified !== undefined
      ? { emailVerified: identity.emailVerified }
      : {}),
    ...(profile.givenName ? { givenName: profile.givenName } : {}),
    ...(profile.familyName ? { familyName: profile.familyName } : {}),
    displayName,
    ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
    status,
    ...(statusChange ? { statusChange } : {}),
    identityProvider: identity.identityProvider,
    ...(primaryRole ? { primaryRole } : {}),
    roles,
    assignments: userAssignments,
    ...(isRootUser ? { isRootUser: true } : {}),
    ...(deletion ? { deletion } : {}),
    ...(identity.createdAt ? { createdAt: identity.createdAt } : {}),
    ...(identity.updatedAt ? { updatedAt: identity.updatedAt } : {}),
    detailLevel,
    ...(detailLevel === "full" ? { profile, identity } : {}),
  };
}

function toMissingCognitoIdentity(record: UserProfileModel): CICognitoUser {
  return {
    id: record.userId,
    username: record.username,
    enabled: false,
    status: "UNKNOWN",
    ...(record.email ? { email: record.email } : {}),
    ...(record.emailVerified !== null && record.emailVerified !== undefined
      ? { emailVerified: record.emailVerified }
      : {}),
    ...(record.givenName ? { givenName: record.givenName } : {}),
    ...(record.middleName ? { middleName: record.middleName } : {}),
    ...(record.familyName ? { familyName: record.familyName } : {}),
    identityProvider: {
      id: "cognito-user-pool",
      label: "Amazon Cognito · identity missing",
      kind: "native",
    },
    attributes: {},
    groups: (record.roles ?? [])
      .filter((role): role is string => typeof role === "string")
      .map((id) => ({ id })),
    isRootUser: record.isRootUser === true,
    ...(record.createdAt ? { createdAt: record.createdAt } : {}),
    ...(record.updatedAt ? { updatedAt: record.updatedAt } : {}),
  };
}

function userPoolId(): string {
  const value = outputs.auth?.user_pool_id;
  if (!value)
    throw new Error("The active Cognito User Pool is not configured.");
  return value;
}

async function listCognitoIdentities(): Promise<CICognitoUser[]> {
  const users: CICognitoUser[] = [];
  let paginationToken: string | undefined;
  for (let page = 0; page < 10; page += 1) {
    const response = await appServerClient.queries.ListCognitoUsers(
      {
        inputString: JSON.stringify({
          userPoolId: userPoolId(),
          limit: 60,
          ...(paginationToken ? { paginationToken } : {}),
        }),
      },
      { authMode: "userPool" },
    );
    const result = requireGraphqlOk<CICognitoUsersPage>(
      ciParseGraphqlResponse(response, true),
    );
    users.push(...result.users);
    paginationToken = result.paginationToken;
    if (!paginationToken) break;
  }
  return users;
}

async function listProfiles(
  deletionState: "active" | "deleted",
): Promise<UserProfileModel[]> {
  const result =
    await appServerClient.models.UserProfile.listUserProfileByDeletionState(
      { deletionState },
      { limit: 1000, authMode: "userPool" },
    );
  assertNoModelErrors(result.errors);
  return result.data;
}

export async function appListUserRecords(
  assignments: readonly CiSecurityStoredRoleAssignment[],
  deletionState: "active" | "deleted" = "active",
): Promise<CIUser[]> {
  const [identities, profiles] = await Promise.all([
    listCognitoIdentities(),
    listProfiles(deletionState),
  ]);
  const profilesById = new Map(
    profiles.map((profile) => [profile.userId, profile]),
  );
  const identityIds = new Set(identities.map((identity) => identity.id));

  const users = identities
    .filter((identity) =>
      deletionState === "deleted"
        ? Boolean(decodeDeletion(profilesById.get(identity.id)?.deletion))
        : !decodeDeletion(profilesById.get(identity.id)?.deletion),
    )
    .map((identity) =>
      toUser(identity, profilesById.get(identity.id), assignments),
    );

  if (deletionState === "deleted") {
    users.push(
      ...profiles
        .filter(
          (profile) =>
            !identityIds.has(profile.userId) &&
            Boolean(decodeDeletion(profile.deletion)),
        )
        .map((profile) =>
          toUser(toMissingCognitoIdentity(profile), profile, assignments),
        ),
    );
  }

  return users;
}

/** Load the full profile and provider identity only for detail/edit workflows. */
export async function appGetUserRecord(
  userId: string,
  assignments: readonly CiSecurityStoredRoleAssignment[],
): Promise<CIUser<CICognitoUser>> {
  const profile = await requireProfile(userId);
  const response = await appServerClient.queries.GetCognitoUser(
    {
      inputString: JSON.stringify({
        cognito: {
          UserPoolId: userPoolId(),
          Username: profile.username,
        },
      }),
    },
    { authMode: "userPool" },
  );
  const identity = requireGraphqlOk<CICognitoUser>(
    ciParseGraphqlResponse(response, true),
  );
  return toUser(identity, profile, assignments, "full");
}

export async function appCreateUserRecord(
  input: CICreateUserInput,
): Promise<CIUser<CICognitoUser>> {
  const response = await appServerClient.mutations.CreateCognitoUser(
    {
      inputString: JSON.stringify({
        cognito: {
          UserPoolId: userPoolId(),
          Username: input.email.trim().toLowerCase(),
          ...(input.temporaryPassword
            ? { TemporaryPassword: input.temporaryPassword }
            : {}),
          ...(input.sendInvitation === false
            ? { MessageAction: "SUPPRESS" }
            : {}),
          UserAttributes: [
            { Name: "email", Value: input.email.trim().toLowerCase() },
            { Name: "given_name", Value: input.givenName.trim() },
            ...(input.middleName?.trim()
              ? [{ Name: "middle_name", Value: input.middleName.trim() }]
              : []),
            { Name: "family_name", Value: input.familyName.trim() },
          ],
        },
        groups: input.roles,
      }),
    },
    { authMode: "userPool" },
  );
  const identity = requireGraphqlOk<CICognitoUser>(
    ciParseGraphqlResponse(response, true),
  );
  const profile = input.profile ?? {};
  try {
    const created = await appServerClient.models.UserProfile.create(
      ciSerializeUserProfileAwsJsonFields({
        userId: identity.id,
        username: identity.username,
        email: identity.email,
        emailVerified: identity.emailVerified,
        profileOwner: `${identity.id}::${identity.username}`,
        roles: input.roles,
        status: "active",
        deletionState: "active",
        displayName:
          profile.displayName ||
          `${input.givenName} ${input.familyName}`.trim(),
        ...(profile.title ? { title: profile.title } : {}),
        givenName: input.givenName,
        ...(input.middleName ? { middleName: input.middleName } : {}),
        familyName: input.familyName,
        ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
        ...(profile.avatarKey ? { avatarKey: profile.avatarKey } : {}),
        ...(profile.phoneNumber ? { phoneNumber: profile.phoneNumber } : {}),
        ...(profile.locale ? { locale: profile.locale } : {}),
        ...(profile.timeZone ? { timeZone: profile.timeZone } : {}),
        ...(profile.bio ? { bio: profile.bio } : {}),
        ...(profile.birthDate ? { birthDate: profile.birthDate } : {}),
        ...(profile.gender ? { gender: profile.gender } : {}),
        address: profile.address,
        extensions: profile.extensions,
      }),
      { authMode: "userPool" },
    );
    assertNoModelErrors(created.errors);
    return toUser(identity, created.data ?? undefined, [], "full");
  } catch (error) {
    try {
      const rollback = await appServerClient.mutations.DeleteCognitoUser(
        {
          inputString: JSON.stringify({
            cognito: {
              UserPoolId: userPoolId(),
              Username: identity.username,
            },
          }),
        },
        { authMode: "userPool" },
      );
      requireGraphqlOk(ciParseGraphqlResponse(rollback, true));
    } catch (rollbackError) {
      throw new AggregateError(
        [error, rollbackError],
        `User Profile creation failed and Cognito rollback also failed for "${identity.id}".`,
      );
    }
    throw error;
  }
}

async function requireProfile(userId: string): Promise<UserProfileModel> {
  const result = await appServerClient.models.UserProfile.get(
    { userId },
    { authMode: "userPool" },
  );
  assertNoModelErrors(result.errors);
  if (!result.data) {
    throw new Error(`User Profile "${userId}" was not found.`);
  }
  return result.data;
}

export async function appUpdateUserRecord(
  input: CIUpdateUserInput,
): Promise<void> {
  const current = await requireProfile(input.userId);
  const attributes = [
    ...(input.email?.trim()
      ? [{ Name: "email", Value: input.email.trim().toLowerCase() }]
      : []),
    ...(input.givenName?.trim()
      ? [{ Name: "given_name", Value: input.givenName.trim() }]
      : []),
    ...(input.middleName?.trim()
      ? [{ Name: "middle_name", Value: input.middleName.trim() }]
      : []),
    ...(input.familyName?.trim()
      ? [{ Name: "family_name", Value: input.familyName.trim() }]
      : []),
  ];
  if (attributes.length || input.roles) {
    const response = await appServerClient.mutations.UpdateCognitoUser(
      {
        inputString: JSON.stringify({
          cognito: {
            UserPoolId: userPoolId(),
            Username: current.username,
            UserAttributes: attributes,
          },
          ...(input.roles ? { groups: input.roles } : {}),
        }),
      },
      { authMode: "userPool" },
    );
    requireGraphqlOk(ciParseGraphqlResponse(response, true));
  }
  const profile = input.profile ?? {};
  const updated = await appServerClient.models.UserProfile.update(
    ciSerializeUserProfileAwsJsonFields({
      userId: input.userId,
      ...(input.email?.trim()
        ? { email: input.email.trim().toLowerCase() }
        : {}),
      ...(profile.displayName ? { displayName: profile.displayName } : {}),
      ...(profile.title ? { title: profile.title } : {}),
      ...(input.givenName ? { givenName: input.givenName } : {}),
      ...(input.middleName ? { middleName: input.middleName } : {}),
      ...(input.familyName ? { familyName: input.familyName } : {}),
      ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
      ...(profile.avatarKey ? { avatarKey: profile.avatarKey } : {}),
      ...(profile.phoneNumber ? { phoneNumber: profile.phoneNumber } : {}),
      ...(profile.locale ? { locale: profile.locale } : {}),
      ...(profile.timeZone ? { timeZone: profile.timeZone } : {}),
      ...(profile.bio ? { bio: profile.bio } : {}),
      ...(profile.birthDate ? { birthDate: profile.birthDate } : {}),
      ...(profile.gender ? { gender: profile.gender } : {}),
      address: profile.address,
      extensions: profile.extensions,
      ...(input.roles ? { roles: input.roles } : {}),
    }),
    { authMode: "userPool" },
  );
  assertNoModelErrors(updated.errors);
}

export async function appSetUserStatus(
  input: CISetUserStatusInput,
  actorId: string,
): Promise<void> {
  const current = await requireProfile(input.userId);
  const response = await appServerClient.mutations.SetCognitoUserEnabled(
    {
      inputString: JSON.stringify({
        userPoolId: userPoolId(),
        username: current.username,
        enabled: input.status === "active",
      }),
    },
    { authMode: "userPool" },
  );
  requireGraphqlOk(ciParseGraphqlResponse(response, true));
  const statusChange: CIUserStatusChange = {
    changedAt: new Date().toISOString(),
    changedBy: actorId,
    reason: input.reason.trim(),
  };
  const updated = await appServerClient.models.UserProfile.update(
    ciSerializeUserProfileAwsJsonFields({
      userId: input.userId,
      status: input.status,
      statusChange,
    }),
    { authMode: "userPool" },
  );
  assertNoModelErrors(updated.errors);
}

export async function appDeleteUserRecord(
  input: CIDeleteUserInput,
  actorId: string,
): Promise<void> {
  const current = await requireProfile(input.userId);
  const response = await appServerClient.mutations.SetCognitoUserEnabled(
    {
      inputString: JSON.stringify({
        userPoolId: userPoolId(),
        username: current.username,
        enabled: false,
      }),
    },
    { authMode: "userPool" },
  );
  requireGraphqlOk(ciParseGraphqlResponse(response, true));
  const deletion: CiResourceDeletionMetadata = {
    state: "deleted",
    operationId: crypto.randomUUID(),
    deletedAt: new Date().toISOString(),
    deletedBy: actorId,
    reason: input.reason.trim(),
  };
  const updated = await appServerClient.models.UserProfile.update(
    ciSerializeUserProfileAwsJsonFields({
      userId: input.userId,
      deletion,
      deletionState: "deleted",
    }),
    { authMode: "userPool" },
  );
  assertNoModelErrors(updated.errors);
}

export async function appRestoreUserRecord(
  input: CIRestoreUserInput,
): Promise<void> {
  const current = await requireProfile(input.userId);
  if (!decodeDeletion(current.deletion)) {
    throw new Error("Only a deleted user can be restored.");
  }
  if (!input.reason.trim()) throw new Error("A reason is required.");
  if (current.status !== "suspended") {
    const response = await appServerClient.mutations.SetCognitoUserEnabled(
      {
        inputString: JSON.stringify({
          userPoolId: userPoolId(),
          username: current.username,
          enabled: true,
        }),
      },
      { authMode: "userPool" },
    );
    requireGraphqlOk(ciParseGraphqlResponse(response, true));
  }
  const updated = await appServerClient.models.UserProfile.update(
    ciSerializeUserProfileAwsJsonFields({
      userId: input.userId,
      deletion: null,
      deletionState: "active",
    }),
    { authMode: "userPool" },
  );
  assertNoModelErrors(updated.errors);
}

export async function appPurgeUserRecord(
  input: CIPurgeUserInput,
): Promise<void> {
  const current = await requireProfile(input.userId);
  if (!decodeDeletion(current.deletion)) {
    throw new Error("Only a deleted user can be permanently deleted.");
  }
  if (!input.reason.trim()) throw new Error("A reason is required.");
  if (input.confirmation !== input.userId) {
    throw new Error(
      "The permanent-delete confirmation does not match the user ID.",
    );
  }
  const response = await appServerClient.mutations.DeleteCognitoUser(
    {
      inputString: JSON.stringify({
        cognito: {
          UserPoolId: userPoolId(),
          Username: current.username,
        },
      }),
    },
    { authMode: "userPool" },
  );
  requireGraphqlOk(ciParseGraphqlResponse(response, true));
  const deleted = await appServerClient.models.UserProfile.delete(
    { userId: input.userId },
    { authMode: "userPool" },
  );
  assertNoModelErrors(deleted.errors);
}
