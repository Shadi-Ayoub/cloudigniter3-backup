import "server-only";
import {
  ciCreateAuthorizer,
  ciCreateAuthorizationSubject,
  ciCreateRoleAssignments,
  ciSystemAccessScope,
  ciCanManageSettings,
} from "@cloudigniter/core/lib";
import { ciGetNextAwsSettingsAccess } from "@cloudigniter/next/server";
import type { CiNextContext } from "@cloudigniter/next/types";
import type { CiSettingsTarget } from "@cloudigniter/core/types";
import { appAccessControl } from "@/custom/auth/app-access-control";
import { appServerClient } from "../api/app-server-client";
import { appSettingsBackendAvailable } from "./app-settings-manager";

/** Query Settings authority directly: custom roles need no Security Administration permissions. */
export async function appSettingsAccess(
  context: CiNextContext,
  target: CiSettingsTarget = { scope: "system" },
) {
  if (!context.auth.user.authenticated || !context.auth.user.id)
    return ciGetNextAwsSettingsAccess(async () => ({
      data: { ok: false, statusCode: 401, body: {} },
    }));
  if (!appSettingsBackendAvailable) {
    // Resolve draft-editing permissions separately from storage readiness.
    // The unprovisioned manager still rejects every persistence operation.
    const authorizer = ciCreateAuthorizer(appAccessControl);
    const subject = ciCreateAuthorizationSubject(
      { id: context.auth.user.id, authenticated: true },
      ciCreateRoleAssignments(
        context.auth.user.roles,
        ciSystemAccessScope(),
        "exact",
      ),
    );
    return ciGetNextAwsSettingsAccess(async () => ({
      data: {
        read: ciCanManageSettings(authorizer, subject, "read", target),
        update: ciCanManageSettings(authorizer, subject, "update", target),
        enforce: ciCanManageSettings(authorizer, subject, "enforce", target),
        overwrite: ciCanManageSettings(
          authorizer,
          subject,
          "overwrite",
          target,
        ),
      },
    }));
  }
  return ciGetNextAwsSettingsAccess(() =>
    appServerClient.queries.GetSettings(
      { inputString: JSON.stringify({ access: true, target }) },
      { authMode: "userPool" },
    ),
  );
}
