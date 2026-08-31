"use server";

import { revalidatePath } from "next/cache";
import {
  ciCreateAuthorizationSubject,
  ciCreateAuthorizer,
  ciCreateRoleAssignments,
  ciCanAccessDeveloperTools,
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
  CIUserMutationResult,
  CIUserSeederDataItem,
  CIUserSeederExecutionResult,
  CiAccessScope,
  CiSecurityAssignmentRecord,
} from "@cloudigniter/core/types";
import { testUsersSeeder } from "@/custom/dev/seeder";
import {
  appBootstrap,
  appCreateSecurityAdministration,
  appCreateUserRecord,
  appDeleteUserRecord,
  appGetUserRecord,
  appListUserRecords,
  appPurgeUserRecord,
  appRestoreUserRecord,
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
  const definition = await security.loadDefinition();
  const subject = ciCreateAuthorizationSubject(
    {
      id: context.auth.user.id ?? "anonymous",
      authenticated: context.auth.user.authenticated,
    },
    ciCreateRoleAssignments(
      context.auth.user.roles,
      ciSystemAccessScope(),
      "exact",
    ),
  );
  const allowed = ciCreateAuthorizer(definition).can({
    subject,
    resource: "identity.users",
    action,
    scope: ciSystemAccessScope(),
  });
  if (!allowed) throw new Error(`You cannot ${action} users.`);
  return { context, definition, security };
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
    const { context, definition, security } = await requireUserAction("create");
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
    ].find((roleId) => !knownRoleIds.has(roleId));
    if (unknownRoleId) throw new Error(`Unknown role "${unknownRoleId}".`);
    if (
      input.roles.includes("system-super-admin") &&
      !security.capabilities.canManageCore
    ) {
      throw new Error(
        "Only a directly assigned system super administrator can grant system-super-admin.",
      );
    }
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
    const { definition, security } = await requireUserAction("update");
    if (input.roles || input.assignments) {
      await requireUserAction("assign-role");
      if (!input.roles?.length) throw new Error("Assign at least one role.");
      if (!input.assignments?.length) {
        throw new Error("Create at least one scoped role assignment.");
      }
      const knownRoleIds = new Set(definition.roles.map((role) => role.id));
      const unknownRoleId = [
        ...input.roles,
        ...input.assignments.map((assignment) => assignment.roleId),
      ].find((roleId) => !knownRoleIds.has(roleId));
      if (unknownRoleId) throw new Error(`Unknown role "${unknownRoleId}".`);
      const target = await appGetUserRecord(
        input.userId,
        await security.loadAssignments(),
      );
      if (
        target.roles.includes("system-super-admin") &&
        !security.capabilities.canManageCore
      ) {
        throw new Error(
          "Only a system super administrator can edit this user.",
        );
      }
      if (
        input.roles.includes("system-super-admin") &&
        !security.capabilities.canManageCore
      ) {
        throw new Error(
          "Only a directly assigned system super administrator can grant system-super-admin.",
        );
      }
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
    const { security } = await requireUserAction("read");
    const user = await appGetUserRecord(
      userId,
      await security.loadAssignments(),
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
    const { context, security } = await requireUserAction("update");
    if (context.auth.user.id === input.userId && input.status === "suspended") {
      throw new Error("You cannot suspend your own active account.");
    }
    if (!input.reason.trim()) throw new Error("A reason is required.");
    const target = (
      await appListUserRecords(await security.loadAssignments())
    ).find((user) => user.id === input.userId);
    if (target?.roles.includes("system-super-admin")) {
      throw new Error("A system-super-admin account cannot be suspended.");
    }
    await appSetUserStatus(
      input,
      context.auth.user.id ?? "system-administrator",
    );
    revalidatePath("/dashboard/users");
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
    const { context, security } = await requireUserAction("delete");
    if (context.auth.user.id === input.userId) {
      throw new Error("You cannot delete your own active account.");
    }
    if (!input.reason.trim()) throw new Error("A reason is required.");
    const target = (
      await appListUserRecords(await security.loadAssignments())
    ).find((user) => user.id === input.userId);
    if (target?.roles.includes("system-super-admin")) {
      throw new Error("A system-super-admin account cannot be deleted.");
    }
    await appDeleteUserRecord(
      input,
      context.auth.user.id ?? "system-administrator",
    );
    revalidatePath("/dashboard/users");
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
    await requireUserAction("restore");
    await appRestoreUserRecord(input);
    revalidatePath("/dashboard/users");
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
    const { security } = await requireUserAction("purge");
    if (!input.reason.trim()) throw new Error("A reason is required.");
    if (input.confirmation !== input.userId) {
      throw new Error("The confirmation must exactly match the user ID.");
    }
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
    revalidatePath("/dashboard/trash");
    return { ok: true, message: "The user was permanently deleted." };
  } catch (error) {
    return { ok: false, message: ciNormalizeThrownError(error).message };
  }
}
