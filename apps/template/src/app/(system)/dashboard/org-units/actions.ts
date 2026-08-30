"use server";

import { revalidatePath } from "next/cache";
import { ciNormalizeThrownError } from "@cloudigniter/core/lib";
import type {
  CiCreateOrgUnitInput,
  CiOrgUnitManagementRow,
  CiResourceLifecycleMutationResult,
  CiUpdateOrgUnitInput,
} from "@cloudigniter/core/types";
import {
  appCreateOrgUnitRecord,
  appUpdateOrgUnitRecord,
} from "@/kernel/server/api/system/org-unit/app-org-unit-management-service";

export async function createOrgUnitAction(
  input: CiCreateOrgUnitInput,
): Promise<CiResourceLifecycleMutationResult<CiOrgUnitManagementRow>> {
  try {
    const orgUnit = await appCreateOrgUnitRecord(input);
    revalidatePath("/dashboard/org-units");
    return {
      ok: true,
      message: `${orgUnit.name} was created.`,
      resource: orgUnit,
    };
  } catch (error) {
    return { ok: false, message: ciNormalizeThrownError(error).message };
  }
}

export async function updateOrgUnitAction(
  input: CiUpdateOrgUnitInput,
): Promise<CiResourceLifecycleMutationResult<CiOrgUnitManagementRow>> {
  try {
    const orgUnit = await appUpdateOrgUnitRecord(input);
    revalidatePath("/dashboard/org-units");
    return {
      ok: true,
      message: `${orgUnit.name} was updated.`,
      resource: orgUnit,
    };
  } catch (error) {
    return { ok: false, message: ciNormalizeThrownError(error).message };
  }
}
