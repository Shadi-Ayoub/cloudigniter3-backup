"use server";

import { revalidatePath } from "next/cache";
import { ciNormalizeThrownError } from "@cloudigniter/core/lib";
import type {
  CiSecurityMutationResult,
  CiSecurityRecord,
} from "@cloudigniter/core/types";
import { appBootstrap, appCreateSecurityAdministration } from "@/kernel/server";

/** Validates and persists one provider-neutral access-control record. */
export async function saveSecurityRecordAction(
  record: CiSecurityRecord,
  reason?: string
): Promise<CiSecurityMutationResult> {
  try {
    const context = await appBootstrap();
    await appCreateSecurityAdministration(context).saveRecord(record, reason);
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
