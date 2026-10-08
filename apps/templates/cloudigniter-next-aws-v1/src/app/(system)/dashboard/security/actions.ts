"use server";

import { revalidatePath } from "next/cache";
import { ciNormalizeThrownError } from "@cloudigniter/core/lib";
import type {
  CiSecurityMutationResult,
  CiSecurityRecord,
  CiRoleStatus,
} from "@cloudigniter/core/types";
import { appBootstrap, appCreateSecurityAdministration } from "@/kernel/server";

const CONCURRENT_ACCESS_CONTROL_STATE_ERROR =
  "The access-control state changed concurrently; retry the mutation.";

function ciIsConcurrentAccessControlStateError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes(CONCURRENT_ACCESS_CONTROL_STATE_ERROR)
  );
}

/** Validates and persists one provider-neutral access-control record. */
export async function saveSecurityRecordAction(
  record: CiSecurityRecord,
  reason?: string
): Promise<CiSecurityMutationResult> {
  try {
    const context = await appBootstrap();
    try {
      await appCreateSecurityAdministration(context).saveRecord(record, reason);
    } catch (error) {
      if (!ciIsConcurrentAccessControlStateError(error)) throw error;

      // Re-read the latest definition and merge the requested change once more.
      // This handles a transient race without masking a persistent conflict.
      await appCreateSecurityAdministration(context).saveRecord(record, reason);
    }
    revalidatePath("/dashboard/security", "layout");
    return { ok: true, message: `${record.title || record.id} was saved.` };
  } catch (error) {
    return { ok: false, message: ciNormalizeThrownError(error).message };
  }
}

/** Validates and deletes one application-owned access-control record. */
export async function deleteSecurityRecordAction(
  record: CiSecurityRecord
): Promise<CiSecurityMutationResult> {
  try {
    const context = await appBootstrap();
    await appCreateSecurityAdministration(context).deleteRecord(record);
    revalidatePath("/dashboard/security", "layout");
    return { ok: true, message: `${record.title || record.id} was deleted.` };
  } catch (error) {
    return { ok: false, message: ciNormalizeThrownError(error).message };
  }
}

/** Suspends or restores one role while preserving its assignments. */
export async function setSecurityRoleStatusAction(
  roleId: string,
  status: CiRoleStatus,
  reason: string
): Promise<CiSecurityMutationResult> {
  try {
    const context = await appBootstrap();
    await appCreateSecurityAdministration(context).setRoleStatus({
      roleId,
      status,
      reason,
    });
    revalidatePath("/dashboard/security", "layout");
    return {
      ok: true,
      message: `Role ${roleId} was ${
        status === "suspended" ? "suspended" : "restored"
      }.`,
    };
  } catch (error) {
    return { ok: false, message: ciNormalizeThrownError(error).message };
  }
}
