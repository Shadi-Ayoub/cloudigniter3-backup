"use server";

import { revalidatePath } from "next/cache";
import {
  ciCreateAuthorizer,
  CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE,
  ciCanAccessDeveloperTools,
  ciCanManageAdministrator,
  ciGlobalAccessScope,
  ciIsAdministratorRole,
  ciNormalizeThrownError,
  ciSystemAccessScope,
} from "@cloudigniter/core/lib";
import { ciReadJsonSeederData } from "@cloudigniter/core/server";
import type {
  CICreateUserInput,
  CIDeleteUserInput,
  CIPurgeUserInput,
  CIRestoreUserInput,
  CISetUserStatusInput,
  CIUpdateUserInput,
  CIUser,
  CIUserMutationResult,
  CIUserSeederDataItem,
  CIUserSeederExecutionResult,
  CiAccessScope,
  CiSecurityAssignmentRecord,
} from "@cloudigniter/core/types";
import { testUsersSeeder } from "@/custom/dev/seeder";
import {
  appBootstrap,
  appCanManageSystemSuperAdministrators,
  appCreateSecurityAdministration,
  appCreateUserManagementAuthorizationSubject,
  appCreateUserRecord,
  appDeleteUserRecord,
  appGetUserRecord,
  appIsUserAssignmentActive,
  appListUserRecords,
  appPurgeUserRecord,
  appRestoreUserRecord,
  appResolveAdministratorActor,
  appSetUserStatus,
  appUpdateUserRecord,
} from "@/kernel/server";

type UserAction =
  | "assign-role"
  | "create"
  | "delete"
  | "email"
  | "impersonate"
  | "purge"
  | "read"
  | "restore"
  | "update";

const USER_SEEDER_EXTENSION_KEY = "cloudigniterSeeder";

async function requireUserAction(action: UserAction) {
  const context = await appBootstrap();
  const security = appCreateSecurityAdministration(context);
  const [definition, assignments] = await Promise.all([
    security.loadDefinition(),
    security.loadAssignments(),
  ]);
  const subject = appCreateUserManagementAuthorizationSubject(
    context,
    assignments,
  );
  const authorizer = ciCreateAuthorizer(definition);
  const policyAllowed = [ciSystemAccessScope(), ciGlobalAccessScope()].some(
    (scope) =>
      authorizer.can({
        subject,
        resource: "identity.users",
        action,
        scope,
      }),
  );
  const delegatedAction = [
    "assign-role",
    "delete",
    "email",
    "purge",
    "read",
    "restore",
    "update",
  ].includes(action);
  const allowed =
    policyAllowed ||
    (delegatedAction &&
      appCanManageSystemSuperAdministrators(context, assignments));
  if (!allowed) throw new Error(`You cannot ${action} users.`);
  return {
    context,
    definition,
    security,
    assignments,
    policyAllowed,
    actor: appResolveAdministratorActor(context, assignments),
  };
}

type UserActionContext = Awaited<ReturnType<typeof requireUserAction>>;

function userManagementSubject(user: CIUser) {
  return {
    id: user.id,
    effectiveRoleIds: Array.from(
      new Set([
        ...user.roles,
        ...user.assignments
          .filter((assignment) => appIsUserAssignmentActive(assignment))
          .map((assignment) => assignment.roleId),
      ]),
    ),
    isRootUser: user.isRootUser === true,
  };
}

function assertCanManageTarget(
  state: UserActionContext,
  target: CIUser,
  operation: "profile-edit" | "account-management" = "account-management",
): void {
  const targetSubject = userManagementSubject(target);
  if (
    !state.policyAllowed &&
    !(
      state.actor.canManageSystemSuperAdmins === true &&
      targetSubject.effectiveRoleIds.includes("system-super-admin")
    )
  ) {
    throw new Error(
      "The delegated authority only permits managing system super administrators.",
    );
  }

  const isAdministrator =
    target.isRootUser === true ||
    targetSubject.effectiveRoleIds.some(ciIsAdministratorRole);
  if (!isAdministrator) return;

  if (
    !ciCanManageAdministrator({
      actor: state.actor,
      target: targetSubject,
      operation,
    })
  ) {
    throw new Error(
      target.isRootUser
        ? "Only the Root User owner can edit the Root User profile."
        : "You cannot manage an administrator at a higher authority level.",
    );
  }
}

function assertCanGrantRequestedAdministratorRoles(
  state: UserActionContext,
  targetId: string,
  roles: readonly string[],
): void {
  if (!roles.some(ciIsAdministratorRole)) return;
  const requestedTarget = {
    id: targetId,
    effectiveRoleIds: roles,
    isRootUser: false,
  };
  if (
    !ciCanManageAdministrator({
      actor: state.actor,
      target: requestedTarget,
      operation: "account-management",
    })
  ) {
    throw new Error(
      "You cannot grant an administrator role above your authority level.",
    );
  }
}

function specialDelegationSignature(
  assignments: readonly CICreateUserInput["assignments"][number][],
): string[] {
  return assignments
    .filter(
      (assignment) => assignment.roleId === CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE,
    )
    .map((assignment) => `${assignment.scope.kind}:${assignment.propagation}`)
    .sort();
}

function assertDelegatedSystemSuperManagement(
  state: UserActionContext,
  targetRoles: readonly string[],
  desired: readonly CICreateUserInput["assignments"][number][],
  existing: readonly CICreateUserInput["assignments"][number][] = [],
): void {
  const desiredSpecial = desired.filter(
    (assignment) => assignment.roleId === CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE,
  );
  const changed =
    JSON.stringify(specialDelegationSignature(desired)) !==
    JSON.stringify(specialDelegationSignature(existing));
  if (!changed && desiredSpecial.length === 0) return;
  if (!state.actor.isRootUser && changed) {
    throw new Error(
      "Only the Root User can grant or revoke system-super-admin management.",
    );
  }
  if (desiredSpecial.length) {
    if (!targetRoles.some(ciIsAdministratorRole)) {
      throw new Error(
        "System-super-admin management can only be assigned to an administrator.",
      );
    }
    if (
      desiredSpecial.some(
        (assignment) =>
          assignment.scope.kind !== "system" ||
          assignment.propagation !== "exact",
      )
    ) {
      throw new Error(
        "System-super-admin management requires an exact system scope.",
      );
    }
  }
}

function assignmentScopeId(scope: CiAccessScope): string | undefined {
  if (scope.kind === "tenant") return scope.tenantId;
  if (scope.kind === "orgUnit") return `${scope.tenantId}:${scope.orgUnitId}`;
  return undefined;
}

function toAssignmentRecord(
  subjectId: string,
  input: CICreateUserInput["assignments"][number],
): CiSecurityAssignmentRecord {
  return {
    kind: "assignment",
    id: "new-assignment",
    title: `${input.roleId} assignment`,
    description: `Created with user ${subjectId}`,
    origin: "application",
    locked: false,
    subjectId,
    roleId: input.roleId,
    scopeKind: input.scope.kind,
    ...(assignmentScopeId(input.scope)
      ? { scopeId: assignmentScopeId(input.scope) }
      : {}),
    propagation: input.propagation,
  };
}

export async function createUserAction(
  input: CICreateUserInput,
): Promise<CIUserMutationResult> {
  try {
    const state = await requireUserAction("create");
    const { context, definition, security } = state;
    await requireUserAction("assign-role");
    if (
      !input.email.trim() ||
      !input.givenName.trim() ||
      !input.familyName.trim()
    ) {
      throw new Error("Email, given name, and family name are required.");
    }
    if (!input.roles.length) throw new Error("Assign at least one role.");
    if (!input.assignments.length) {
      throw new Error("Create at least one scoped role assignment.");
    }
    const knownRoleIds = new Set(definition.roles.map((role) => role.id));
    const unknownRoleId = [
      ...input.roles,
      ...input.assignments.map((item) => item.roleId),
    ].find(
      (roleId) =>
        roleId !== CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE &&
        !knownRoleIds.has(roleId),
    );
    if (unknownRoleId) throw new Error(`Unknown role "${unknownRoleId}".`);
    assertCanGrantRequestedAdministratorRoles(state, input.email, [
      ...input.roles,
      ...input.assignments.map((assignment) => assignment.roleId),
    ]);
    assertDelegatedSystemSuperManagement(
      state,
      [
        ...input.roles,
        ...input.assignments.map((assignment) => assignment.roleId),
      ],
      input.assignments,
    );
    const created = await appCreateUserRecord(input);
    try {
      for (const assignment of input.assignments) {
        await security.saveRecord(toAssignmentRecord(created.id, assignment));
      }
    } catch (error) {
      await appDeleteUserRecord(
        {
          userId: created.id,
          reason: "Automatic rollback after assignment creation failed.",
        },
        context.auth.user.id ?? "system",
      );
      throw error;
    }
    const assignments = await security.loadAssignments();
    const user = (await appListUserRecords(assignments)).find(
      (record) => record.id === created.id,
    );
    revalidatePath("/dashboard/users");
    revalidatePath("/dashboard/administrators");
    return {
      ok: true,
      message: `${created.displayName} was created with ${input.roles.length} role(s) and ${input.assignments.length} assignment(s).`,
      user: user ?? created,
    };
  } catch (error) {
    return { ok: false, message: ciNormalizeThrownError(error).message };
  }
}

export async function updateUserAction(
  input: CIUpdateUserInput,
): Promise<CIUserMutationResult> {
  try {
    const state = await requireUserAction("update");
    const { definition, security, assignments } = state;
    const target = await appGetUserRecord(input.userId, assignments);
    assertCanManageTarget(
      state,
      target,
      target.isRootUser ? "profile-edit" : "account-management",
    );
    if (target.isRootUser && (input.roles || input.assignments)) {
      throw new Error("Root User roles and assignments are immutable.");
    }
    if (input.roles || input.assignments) {
      const assignmentState = await requireUserAction("assign-role");
      assertCanManageTarget(assignmentState, target);
      if (!input.roles?.length) throw new Error("Assign at least one role.");
      if (!input.assignments?.length) {
        throw new Error("Create at least one scoped role assignment.");
      }
      const knownRoleIds = new Set(definition.roles.map((role) => role.id));
      const unknownRoleId = [
        ...input.roles,
        ...input.assignments.map((assignment) => assignment.roleId),
      ].find(
        (roleId) =>
          roleId !== CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE &&
          !knownRoleIds.has(roleId),
      );
      if (unknownRoleId) throw new Error(`Unknown role "${unknownRoleId}".`);
      assertCanGrantRequestedAdministratorRoles(state, input.userId, [
        ...input.roles,
        ...input.assignments.map((assignment) => assignment.roleId),
      ]);
      assertDelegatedSystemSuperManagement(
        state,
        [
          ...input.roles,
          ...input.assignments.map((assignment) => assignment.roleId),
        ],
        input.assignments,
        target.assignments,
      );
    }
    await appUpdateUserRecord(input);
    if (input.assignments) {
      const [assignments, counters] = await Promise.all([
        security.loadAssignments(),
        security.loadRoleCounters(),
      ]);
      const existing = security
        .buildRecords(definition, assignments, counters)
        .assignment.filter(
          (assignment) => assignment.subjectId === input.userId,
        );
      for (const assignment of existing) {
        await security.deleteRecord(assignment);
      }
      for (const assignment of input.assignments) {
        await security.saveRecord(toAssignmentRecord(input.userId, assignment));
      }
    }
    const user = await appGetUserRecord(
      input.userId,
      await security.loadAssignments(),
    );
    revalidatePath("/dashboard/users");
    revalidatePath("/dashboard/administrators");
    return {
      ok: true,
      message:
        "The user account, profile, roles, and assignments were updated.",
      user,
    };
  } catch (error) {
    return { ok: false, message: ciNormalizeThrownError(error).message };
  }
}

export async function readUserAction(
  userId: string,
): Promise<CIUserMutationResult> {
  try {
    const state = await requireUserAction("read");
    const { security } = state;
    const user = await appGetUserRecord(
      userId,
      await security.loadAssignments(),
    );
    assertCanManageTarget(
      state,
      user,
      user.isRootUser ? "profile-edit" : "account-management",
    );
    return { ok: true, message: "User details loaded.", user };
  } catch (error) {
    return { ok: false, message: ciNormalizeThrownError(error).message };
  }
}

function validateUserSeederItem(value: unknown): CIUserSeederDataItem {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Each user seeder item must be a JSON object.");
  }
  const item = value as Partial<CIUserSeederDataItem>;
  if (
    !item.email?.trim() ||
    !item.givenName?.trim() ||
    !item.familyName?.trim()
  ) {
    throw new Error(
      "Every user fixture requires email, givenName, and familyName.",
    );
  }
  if (!item.roles?.length || !item.assignments?.length) {
    throw new Error(
      `User fixture "${item.email}" requires roles and assignments.`,
    );
  }
  if (
    item.profile !== undefined &&
    (typeof item.profile !== "object" ||
      item.profile === null ||
      Array.isArray(item.profile))
  ) {
    throw new Error(`User fixture "${item.email}" requires an object profile.`);
  }
  if (
    item.profile?.address !== undefined &&
    (typeof item.profile.address !== "object" ||
      item.profile.address === null ||
      Array.isArray(item.profile.address))
  ) {
    throw new Error(
      `User fixture "${item.email}" requires address to be a JSON object.`,
    );
  }
  if (
    item.profile?.extensions !== undefined &&
    (typeof item.profile.extensions !== "object" ||
      item.profile.extensions === null ||
      Array.isArray(item.profile.extensions))
  ) {
    throw new Error(
      `User fixture "${item.email}" requires extensions to be a JSON object.`,
    );
  }
  return item as CIUserSeederDataItem;
}

async function requireUserSeederAccess() {
  const context = await appBootstrap();
  const allowed = ciCanAccessDeveloperTools({
    envMode: context.env.mode,
    actor: {
      authenticated: context.auth.user.authenticated,
      roles: context.auth.user.roles,
    },
  });
  if (!allowed) {
    throw new Error(
      "User seeders require an authenticated developer in development mode.",
    );
  }
  return context;
}

function emptyUserSeederResult(
  operation: "seed" | "cleanup",
): CIUserSeederExecutionResult {
  return {
    ok: true,
    seederId: testUsersSeeder.id,
    operation,
    created: 0,
    deleted: 0,
    skipped: 0,
    failed: 0,
    items: [],
    resources: [],
  };
}

export async function seedTestUsersAction(): Promise<CIUserSeederExecutionResult> {
  const result = emptyUserSeederResult("seed");
  try {
    await requireUserSeederAccess();
    const { security } = await requireUserAction("create");
    await requireUserAction("assign-role");
    const fixtures = (
      await ciReadJsonSeederData({ definition: testUsersSeeder })
    ).map(validateUserSeederItem);
    const assignments = await security.loadAssignments();
    const [activeUsers, deletedUsers] = await Promise.all([
      appListUserRecords(assignments),
      appListUserRecords(assignments, "deleted"),
    ]);
    const existing = [...activeUsers, ...deletedUsers];
    for (const fixture of fixtures) {
      const email = fixture.email.trim().toLowerCase();
      const match = existing.find(
        (user) => user.email?.toLowerCase() === email,
      );
      if (match) {
        const detail = await appGetUserRecord(
          match.id,
          await security.loadAssignments(),
        );
        if (
          detail.profile?.extensions?.[USER_SEEDER_EXTENSION_KEY] !==
          testUsersSeeder.id
        ) {
          throw new Error(
            `Seeder will not adopt existing user "${email}" without matching provenance.`,
          );
        }
        if (match.deletion) {
          const restored = await restoreUserAction({
            userId: match.id,
            reason: `Restore for development seeder ${testUsersSeeder.id}.`,
          });
          if (!restored.ok) throw new Error(restored.message);
          result.created += 1;
          result.items.push({
            id: email,
            status: "created",
            message: "Restored the existing seeded user.",
          });
          result.resources?.push(
            await appGetUserRecord(match.id, await security.loadAssignments()),
          );
        } else {
          result.skipped += 1;
          result.items.push({ id: email, status: "skipped" });
          result.resources?.push(detail);
        }
        continue;
      }
      const created = await createUserAction({
        ...fixture,
        email,
        profile: {
          ...fixture.profile,
          extensions: {
            ...fixture.profile?.extensions,
            [USER_SEEDER_EXTENSION_KEY]: testUsersSeeder.id,
          },
        },
      });
      if (!created.ok || !created.user) {
        throw new Error(created.message);
      }
      result.created += 1;
      result.items.push({ id: email, status: "created" });
      result.resources?.push(created.user);
    }
    revalidatePath("/dashboard/users");
    revalidatePath("/dashboard/administrators");
    return result;
  } catch (error) {
    result.ok = false;
    result.failed += 1;
    result.items.push({
      id: testUsersSeeder.id,
      status: "failed",
      message: ciNormalizeThrownError(error).message,
    });
    return result;
  }
}

export async function cleanupTestUsersAction(): Promise<CIUserSeederExecutionResult> {
  const result = emptyUserSeederResult("cleanup");
  try {
    await requireUserSeederAccess();
    const { security } = await requireUserAction("purge");
    await requireUserAction("delete");
    const fixtures = (
      await ciReadJsonSeederData({ definition: testUsersSeeder })
    ).map(validateUserSeederItem);
    const assignments = await security.loadAssignments();
    const [active, deleted] = await Promise.all([
      appListUserRecords(assignments),
      appListUserRecords(assignments, "deleted"),
    ]);
    const users = [...active, ...deleted];
    for (const fixture of fixtures) {
      const email = fixture.email.trim().toLowerCase();
      const match = users.find((user) => user.email?.toLowerCase() === email);
      if (!match) {
        result.skipped += 1;
        result.items.push({ id: email, status: "skipped" });
        continue;
      }
      const detail = await appGetUserRecord(match.id, assignments);
      if (
        detail.profile?.extensions?.[USER_SEEDER_EXTENSION_KEY] !==
        testUsersSeeder.id
      ) {
        throw new Error(
          `Seeder will not delete user "${email}" without matching provenance.`,
        );
      }
      if (!match.deletion) {
        const deletedResult = await deleteUserAction({
          userId: match.id,
          reason: `Cleanup for development seeder ${testUsersSeeder.id}.`,
        });
        if (!deletedResult.ok) throw new Error(deletedResult.message);
      }
      const purged = await purgeUserAction({
        userId: match.id,
        reason: `Cleanup for development seeder ${testUsersSeeder.id}.`,
        confirmation: match.id,
      });
      if (!purged.ok) throw new Error(purged.message);
      result.deleted += 1;
      result.items.push({ id: email, status: "deleted" });
      result.resources?.push(detail);
    }
    revalidatePath("/dashboard/users");
    revalidatePath("/dashboard/administrators");
    revalidatePath("/dashboard/trash");
    return result;
  } catch (error) {
    result.ok = false;
    result.failed += 1;
    result.items.push({
      id: testUsersSeeder.id,
      status: "failed",
      message: ciNormalizeThrownError(error).message,
    });
    return result;
  }
}

export async function setUserStatusAction(
  input: CISetUserStatusInput,
): Promise<CIUserMutationResult> {
  try {
    const state = await requireUserAction("update");
    const { context, assignments } = state;
    if (context.auth.user.id === input.userId && input.status === "suspended") {
      throw new Error("You cannot suspend your own active account.");
    }
    if (!input.reason.trim()) throw new Error("A reason is required.");
    const target = await appGetUserRecord(input.userId, assignments);
    assertCanManageTarget(state, target);
    await appSetUserStatus(
      input,
      context.auth.user.id ?? "system-administrator",
    );
    revalidatePath("/dashboard/users");
    revalidatePath("/dashboard/administrators");
    return {
      ok: true,
      message: `The user was ${input.status === "suspended" ? "suspended" : "activated"}.`,
    };
  } catch (error) {
    return { ok: false, message: ciNormalizeThrownError(error).message };
  }
}

export async function deleteUserAction(
  input: CIDeleteUserInput,
): Promise<CIUserMutationResult> {
  try {
    const state = await requireUserAction("delete");
    const { context, assignments } = state;
    if (context.auth.user.id === input.userId) {
      throw new Error("You cannot delete your own active account.");
    }
    if (!input.reason.trim()) throw new Error("A reason is required.");
    const target = await appGetUserRecord(input.userId, assignments);
    assertCanManageTarget(state, target);
    await appDeleteUserRecord(
      input,
      context.auth.user.id ?? "system-administrator",
    );
    revalidatePath("/dashboard/users");
    revalidatePath("/dashboard/administrators");
    revalidatePath("/dashboard/trash");
    return { ok: true, message: "The user was moved to Trash." };
  } catch (error) {
    return { ok: false, message: ciNormalizeThrownError(error).message };
  }
}

export async function restoreUserAction(
  input: CIRestoreUserInput,
): Promise<CIUserMutationResult> {
  try {
    const state = await requireUserAction("restore");
    const target = await appGetUserRecord(input.userId, state.assignments);
    assertCanManageTarget(state, target);
    await appRestoreUserRecord(input);
    revalidatePath("/dashboard/users");
    revalidatePath("/dashboard/administrators");
    revalidatePath("/dashboard/trash");
    return { ok: true, message: "The user was restored." };
  } catch (error) {
    return { ok: false, message: ciNormalizeThrownError(error).message };
  }
}

export async function purgeUserAction(
  input: CIPurgeUserInput,
): Promise<CIUserMutationResult> {
  try {
    const state = await requireUserAction("purge");
    const { security } = state;
    if (!input.reason.trim()) throw new Error("A reason is required.");
    if (input.confirmation !== input.userId) {
      throw new Error("The confirmation must exactly match the user ID.");
    }
    const target = await appGetUserRecord(input.userId, state.assignments);
    assertCanManageTarget(state, target);
    const [definition, assignments, counters] = await Promise.all([
      security.loadDefinition(),
      security.loadAssignments(),
      security.loadRoleCounters(),
    ]);
    const assignmentRecords = security
      .buildRecords(definition, assignments, counters)
      .assignment.filter((assignment) => assignment.subjectId === input.userId);
    for (const assignment of assignmentRecords) {
      await security.deleteRecord(assignment);
    }
    await appPurgeUserRecord(input);
    revalidatePath("/dashboard/users");
    revalidatePath("/dashboard/administrators");
    revalidatePath("/dashboard/trash");
    return { ok: true, message: "The user was permanently deleted." };
  } catch (error) {
    return { ok: false, message: ciNormalizeThrownError(error).message };
  }
}
