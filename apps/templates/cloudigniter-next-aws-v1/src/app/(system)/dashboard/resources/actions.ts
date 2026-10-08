"use server";

import { revalidatePath } from "next/cache";
import { ciNormalizeThrownError } from "@cloudigniter/core/lib";
import type {
  CiCreateSecurityResourceDomainInput,
  CiResourceDomainStatus,
  CiResourceStatus,
  CiSecurityMutationResult,
  CiSecurityResourceRecord,
} from "@cloudigniter/core/types";
import { appBootstrap, appCreateSecurityAdministration } from "@/kernel/server";

const CONCURRENT_ACCESS_CONTROL_STATE_ERROR =
  "The access-control state changed concurrently; retry the mutation.";

function isConcurrentCatalogStateError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes(CONCURRENT_ACCESS_CONTROL_STATE_ERROR)
  );
}

function revalidateResourcesCatalog() {
  revalidatePath("/dashboard/resources");
}

/** Validates and persists one resource catalog entry. */
export async function saveResourceCatalogRecordAction(
  record: CiSecurityResourceRecord,
  reason?: string,
): Promise<CiSecurityMutationResult> {
  try {
    const context = await appBootstrap();
    try {
      await appCreateSecurityAdministration(context).saveRecord(record, reason);
    } catch (error) {
      if (!isConcurrentCatalogStateError(error)) throw error;
      await appCreateSecurityAdministration(context).saveRecord(record, reason);
    }
    revalidateResourcesCatalog();
    return { ok: true, message: `${record.title || record.id} was saved.` };
  } catch (error) {
    return { ok: false, message: ciNormalizeThrownError(error).message };
  }
}

/** Deletes one application-owned resource catalog entry. */
export async function deleteResourceCatalogRecordAction(
  record: CiSecurityResourceRecord,
): Promise<CiSecurityMutationResult> {
  try {
    const context = await appBootstrap();
    await appCreateSecurityAdministration(context).deleteRecord(record);
    revalidateResourcesCatalog();
    return { ok: true, message: `${record.title || record.id} was deleted.` };
  } catch (error) {
    return { ok: false, message: ciNormalizeThrownError(error).message };
  }
}

/** Creates one application-owned resource domain. */
export async function createResourceDomainAction(
  input: CiCreateSecurityResourceDomainInput,
): Promise<CiSecurityMutationResult> {
  try {
    const context = await appBootstrap();
    await appCreateSecurityAdministration(context).createResourceDomain(input);
    revalidateResourcesCatalog();
    return { ok: true, message: `${input.title.trim()} was created.` };
  } catch (error) {
    return { ok: false, message: ciNormalizeThrownError(error).message };
  }
}

/** Suspends or restores every resource in one catalog domain. */
export async function setResourceDomainStatusAction(
  domainId: string,
  status: CiResourceDomainStatus,
  reason: string,
): Promise<CiSecurityMutationResult> {
  try {
    const context = await appBootstrap();
    await appCreateSecurityAdministration(context).setResourceDomainStatus({
      domainId,
      status,
      reason,
    });
    revalidateResourcesCatalog();
    return {
      ok: true,
      message: `Resource domain ${domainId} was ${
        status === "suspended" ? "suspended" : "restored"
      }.`,
    };
  } catch (error) {
    return { ok: false, message: ciNormalizeThrownError(error).message };
  }
}

/** Suspends or restores one resource without removing its catalog definition. */
export async function setResourceStatusAction(
  resourceId: string,
  status: CiResourceStatus,
  reason: string,
): Promise<CiSecurityMutationResult> {
  try {
    const context = await appBootstrap();
    await appCreateSecurityAdministration(context).setResourceStatus({
      resourceId,
      status,
      reason,
    });
    revalidateResourcesCatalog();
    return {
      ok: true,
      message: `Resource ${resourceId} was ${
        status === "suspended" ? "suspended" : "restored"
      }.`,
    };
  } catch (error) {
    return { ok: false, message: ciNormalizeThrownError(error).message };
  }
}
