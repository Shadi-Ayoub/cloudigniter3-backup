"use server";

import { revalidatePath } from "next/cache";
import {
  ciCanAccessDeveloperTools,
  ciNormalizeThrownError,
} from "@cloudigniter/core/lib";
import type {
  CiDeleteTenantInput,
  CiPurgeTenantInput,
  CiResourceLifecycleMutationResult,
  CiRestoreTenantInput,
  CiSetTenantStatusInput,
  CiTenantHtmlTableRow,
  CiTenantSeederExecutionResult,
} from "@cloudigniter/core/types";
import { testTenantsSeeder } from "@/custom/dev/seeder";
import { appBootstrap } from "@/kernel/server";
import { appRunTenantSeeder } from "@/kernel/server/api/system/seeder/app-tenant-seeder-service";
import {
  appDeleteTenantRecord,
  appPurgeTenantRecord,
  appRestoreTenantRecord,
  appSetTenantStatus,
} from "@/kernel/server/api/system/tenant/app-tenant-lifecycle-service";

function revalidateTenantLifecyclePages(): void {
  revalidatePath("/dashboard/tenants");
  revalidatePath("/dashboard/trash");
}

export async function deleteTenantAction(
  input: CiDeleteTenantInput,
): Promise<CiResourceLifecycleMutationResult<CiTenantHtmlTableRow>> {
  try {
    const tenant = await appDeleteTenantRecord(input);
    revalidateTenantLifecyclePages();
    return {
      ok: true,
      message: `${tenant.name} was moved to Trash.`,
      resource: tenant,
    };
  } catch (error) {
    return { ok: false, message: ciNormalizeThrownError(error).message };
  }
}

export async function restoreTenantAction(
  input: CiRestoreTenantInput,
): Promise<CiResourceLifecycleMutationResult<CiTenantHtmlTableRow>> {
  try {
    const tenant = await appRestoreTenantRecord(input);
    revalidateTenantLifecyclePages();
    return {
      ok: true,
      message: `${tenant.name} was restored.`,
      resource: tenant,
    };
  } catch (error) {
    return { ok: false, message: ciNormalizeThrownError(error).message };
  }
}

export async function purgeTenantAction(
  input: CiPurgeTenantInput,
): Promise<CiResourceLifecycleMutationResult> {
  try {
    await appPurgeTenantRecord(input);
    revalidateTenantLifecyclePages();
    return { ok: true, message: `${input.tenantId} was permanently deleted.` };
  } catch (error) {
    return { ok: false, message: ciNormalizeThrownError(error).message };
  }
}

export async function setTenantStatusAction(
  input: CiSetTenantStatusInput,
): Promise<CiResourceLifecycleMutationResult<CiTenantHtmlTableRow>> {
  try {
    const tenant = await appSetTenantStatus(input);
    revalidateTenantLifecyclePages();
    return {
      ok: true,
      message: `${tenant.name} was ${tenant.status === "suspended" ? "suspended" : "activated"}.`,
      resource: tenant,
    };
  } catch (error) {
    return { ok: false, message: ciNormalizeThrownError(error).message };
  }
}

function failedSeederResult(
  operation: "seed" | "cleanup",
  message: string,
): CiTenantSeederExecutionResult {
  return {
    ok: false,
    seederId: testTenantsSeeder.id,
    operation,
    created: 0,
    deleted: 0,
    skipped: 0,
    failed: 1,
    items: [{ id: testTenantsSeeder.id, status: "failed", message }],
    resources: [],
  };
}

async function requireDeveloperToolsAccess(): Promise<void> {
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
      "Tenant seeders require an authenticated developer in development mode.",
    );
  }
}

export async function seedTestTenantsAction(): Promise<CiTenantSeederExecutionResult> {
  try {
    await requireDeveloperToolsAccess();
    const result = await appRunTenantSeeder(testTenantsSeeder, "seed");
    revalidateTenantLifecyclePages();
    return result;
  } catch (error) {
    return failedSeederResult("seed", ciNormalizeThrownError(error).message);
  }
}

export async function cleanupTestTenantsAction(): Promise<CiTenantSeederExecutionResult> {
  try {
    await requireDeveloperToolsAccess();
    const result = await appRunTenantSeeder(testTenantsSeeder, "cleanup");
    revalidateTenantLifecyclePages();
    return result;
  } catch (error) {
    return failedSeederResult("cleanup", ciNormalizeThrownError(error).message);
  }
}
