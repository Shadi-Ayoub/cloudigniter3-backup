"use server";
import { revalidatePath } from "next/cache";
import {
  ciNormalizeThrownError,
  ciParseSettingsTarget,
  ciParseGraphqlResponse,
} from "@cloudigniter/core/lib";
import type {
  CiSettingsManagerProps,
  CiSettingsManagementView,
} from "@cloudigniter/ui/types";
import type {
  CiSettingsManagementAction,
  CiSettingsUpdate,
  CiSettingsTarget,
  CiSettingsScope,
  CiSettingsTargetPage,
  CiSettingsTenantTarget,
  CiSettingsOverwriteSelection,
} from "@cloudigniter/core/types";
import type { CiNextContext } from "@cloudigniter/next/types";
import { appBootstrap } from "../bootstrap/app-bootstrap";
import { ciBuildSettingsRegistry } from "@/custom/settings/ci-settings-registry";
import { appSettingsAccess } from "./app-settings-access";
import {
  appSettingsManager,
  appSettingsBackendAvailable,
} from "./app-settings-manager";
import { appServerClient } from "../api/app-server-client";

// Server Actions return the same safe access message as the page, retaining form drafts.
async function settingsPermissions(
  context: CiNextContext,
  target?: CiSettingsTarget,
) {
  const result = await appSettingsAccess(context, target);
  if (!result.ok) throw new Error(result.body.error);
  return (action: CiSettingsManagementAction) => result.body[action];
}

export async function appSaveSettings(
  updates: readonly CiSettingsUpdate[],
  inputTarget: CiSettingsTarget = { scope: "system" },
): ReturnType<CiSettingsManagerProps["onSave"]> {
  try {
    const context = await appBootstrap();
    const target = ciParseSettingsTarget(inputTarget);
    const actor = context.auth.user;
    if (!Array.isArray(updates) || !updates.length)
      throw new Error("Provide at least one settings group.");
    const scope = ciBuildSettingsRegistry().get(updates[0].id).scope;
    const canManage =
      scope === "user"
        ? () => false
        : await settingsPermissions(context, target);
    const manager = appSettingsManager(
      { id: actor.id, authenticated: actor.authenticated },
      canManage,
      target,
    );
    const groups = await manager.saveAll(updates);
    revalidatePath("/", "layout");
    return { ok: true, groups };
  } catch (error) {
    return { ok: false, message: ciNormalizeThrownError(error).message };
  }
}

export async function appLoadSettings(
  scope: CiSettingsScope,
  inputTarget: CiSettingsTarget,
): Promise<CiSettingsManagementView> {
  if (scope !== "public" && scope !== "private")
    throw new Error("Select Public or Private settings.");
  const target = ciParseSettingsTarget(inputTarget);
  const context = await appBootstrap();
  const canManage = await settingsPermissions(context, target);
  const actor = context.auth.user;
  const groups = await appSettingsManager(
    { id: actor.id, authenticated: actor.authenticated },
    canManage,
    target,
  ).list(scope);
  return {
    groups,
    canUpdate: canManage("update"),
    canEnforce: canManage("enforce"),
    canOverwrite: canManage("overwrite"),
  };
}

export async function appListSettingsTargets(
  nextToken?: string,
): Promise<CiSettingsTargetPage> {
  const context = await appBootstrap();
  const canManage = await settingsPermissions(context);
  if (!canManage("read"))
    throw new Error("System settings read permission is required.");
  if (!appSettingsBackendAvailable)
    return { items: [{ target: { scope: "global" }, label: "GLOBAL" }] };
  const result = ciParseGraphqlResponse(
    await appServerClient.queries.GetSettings(
      {
        inputString: JSON.stringify({
          targets: true,
          ...(nextToken ? { nextToken } : {}),
        }),
      },
      { authMode: "userPool" },
    ),
    true,
  );
  const body = result.body;
  if (
    !result.ok ||
    !body ||
    typeof body !== "object" ||
    !("items" in body) ||
    !Array.isArray(body.items)
  )
    throw new Error("Unable to list settings tenants.");
  const items = body.items.map((item: unknown) => {
    if (
      !item ||
      typeof item !== "object" ||
      !("target" in item) ||
      !("label" in item) ||
      typeof item.label !== "string"
    )
      throw new Error("Invalid settings tenant response.");
    const target = ciParseSettingsTarget(item.target);
    if (target.scope === "system") throw new Error("Invalid tenant target.");
    return { target, label: item.label };
  });
  return {
    items,
    ...("nextToken" in body && typeof body.nextToken === "string"
      ? { nextToken: body.nextToken }
      : {}),
  };
}

export async function appOverwriteSettings(
  target: CiSettingsTenantTarget,
  selection: readonly CiSettingsOverwriteSelection[],
): Promise<void> {
  const boundary = ciParseSettingsTarget(target);
  if (boundary.scope === "system")
    throw new Error("Choose a tenant to overwrite.");
  const context = await appBootstrap();
  const canManage = await settingsPermissions(context);
  const actor = context.auth.user;
  await appSettingsManager(
    { id: actor.id, authenticated: actor.authenticated },
    canManage,
    boundary,
  ).overwrite(selection);
  revalidatePath("/", "layout");
}
