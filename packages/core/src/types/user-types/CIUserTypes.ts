import type {
  CiAccessScope,
  CiRoleAssignment,
  CiScopePropagation,
} from "../auth-types";
import type { CiResourceDeletionMetadata } from "../resource-lifecycle-types";
import type { CiSeederExecutionResult } from "../dev-types/seeder-types";

/** Provider-neutral identity-provider descriptor safe to expose in application UI. */
export type CIUserIdentityProvider = {
  id: string;
  label: string;
  kind: "native" | "federated";
};

/** Optional structured postal address kept out of the default user summary. */
export type CIUserPostalAddress = {
  line1?: string;
  line2?: string;
  locality?: string;
  region?: string;
  postalCode?: string;
  countryCode?: string;
};

/**
 * CloudIgniter's fixed, provider-neutral profile contract.
 *
 * Personally identifying fields are optional so applications can practice data
 * minimization. `extensions` is the single supported application-owned seam.
 */
export type CIUserProfile = {
  displayName?: string;
  title?: string;
  givenName?: string;
  middleName?: string;
  familyName?: string;
  avatarUrl?: string;
  /** Provider-neutral object key; AWS applications resolve this through S3. */
  avatarKey?: string;
  phoneNumber?: string;
  locale?: string;
  timeZone?: string;
  bio?: string;
  birthDate?: string;
  gender?: string;
  address?: CIUserPostalAddress;
  extensions?: Record<string, unknown>;
};

export type CIUserOperationalStatus = "active" | "invited" | "suspended";

export type CIUserStatusChange = {
  changedAt: string;
  changedBy: string;
  reason: string;
};

/** Persisted User Profile table record. */
export type CIUserEntity = CIUserProfile & {
  userId: string;
  username: string;
  email?: string;
  emailVerified?: boolean;
  profileOwner: string;
  /** List projection of identity-provider groups; provider membership remains authoritative. */
  roles: string[];
  /** Read-only projection of the reserved deployment Root identity marker. */
  isRootUser?: boolean;
  status: CIUserOperationalStatus;
  statusChange?: CIUserStatusChange;
  deletionState: "active" | "deleted";
  deletion?: CiResourceDeletionMetadata;
  createdAt?: string;
  updatedAt?: string;
};

/** Scoped assignment displayed and edited from User administration. */
export type CIUserAssignment = CiRoleAssignment & {
  id: string;
  subjectId: string;
};

/**
 * Application user projection.
 *
 * Lists should normally return `detailLevel: "summary"` and omit `profile`
 * and `identity`. Detail/edit operations may attach the complete profile and
 * a provider-specific identity through the generic parameter.
 */
export type CIUser<TIdentity = unknown> = {
  id: string;
  username: string;
  email?: string;
  emailVerified?: boolean;
  /** Common identity attributes kept in the lightweight list projection. */
  givenName?: string;
  familyName?: string;
  displayName: string;
  avatarUrl?: string;
  status: CIUserOperationalStatus;
  statusChange?: CIUserStatusChange;
  identityProvider: CIUserIdentityProvider;
  /** Highest-precedence identity-provider role; never replaces `roles`. */
  primaryRole?: string;
  roles: string[];
  assignments: CIUserAssignment[];
  /** True only for the uniquely marked deployment bootstrap owner. */
  isRootUser?: boolean;
  /** @deprecated Use `isRootUser`; system-super-admin is not inherently protected. */
  protected?: boolean;
  deletion?: CiResourceDeletionMetadata;
  createdAt?: string;
  updatedAt?: string;
  lastAuthenticatedAt?: string;
  detailLevel: "summary" | "full";
  profile?: CIUserProfile;
  identity?: TIdentity;
};

export type CICreateUserAssignmentInput = {
  roleId: string;
  scope: CiAccessScope;
  propagation: CiScopePropagation;
};

export type CICreateUserInput = {
  email: string;
  givenName: string;
  middleName?: string;
  familyName: string;
  temporaryPassword?: string;
  sendInvitation?: boolean;
  profile?: CIUserProfile;
  roles: string[];
  assignments: CICreateUserAssignmentInput[];
};

export type CIUpdateUserInput = {
  userId: string;
  email?: string;
  givenName?: string;
  middleName?: string;
  familyName?: string;
  profile?: CIUserProfile;
  /** Complete desired Cognito role/group membership. */
  roles?: string[];
  /** Complete desired set of scoped EmberGuard assignments. */
  assignments?: CICreateUserAssignmentInput[];
};

export type CIImpersonateUserInput = {
  userId: string;
  reason: string;
};

export type CISetUserStatusInput = {
  userId: string;
  status: Extract<CIUserOperationalStatus, "active" | "suspended">;
  reason: string;
};

export type CIDeleteUserInput = {
  userId: string;
  reason: string;
};

export type CIRestoreUserInput = {
  userId: string;
  reason: string;
};

export type CIPurgeUserInput = {
  userId: string;
  reason: string;
  confirmation: string;
};

export type CIUserMutationResult =
  { ok: true; message: string; user?: CIUser } | { ok: false; message: string };

export type CIUserSeederDataItem = CICreateUserInput;
export type CIUserSeederExecutionResult = CiSeederExecutionResult<CIUser>;
