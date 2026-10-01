import "server-only";
import { ciCreateNextAwsSettingsManager } from "@cloudigniter/next/server";
import type {
  CiSettingsActor,
  CiSettingsTarget,
  CiSettingsManagementAction,
} from "@cloudigniter/core/types";
import { ciBuildSettingsRegistry } from "@/custom/settings/ci-settings-registry";
import { appServerClient } from "../api/app-server-client";

export const appSettingsBackendAvailable =
  typeof appServerClient.queries.GetSettings === "function" &&
  typeof appServerClient.mutations.SetSettings === "function";

/** Thin application composition; backend operations repeat the authorization checks. */
export function appSettingsManager(
  actor: CiSettingsActor,
  canManage: (
    action: CiSettingsManagementAction,
    target?: CiSettingsTarget,
  ) => boolean | Promise<boolean> = () => false,
  target: CiSettingsTarget = { scope: "system" },
) {
  return ciCreateNextAwsSettingsManager({
    provisioned: appSettingsBackendAvailable,
    registry: ciBuildSettingsRegistry(),
    actor,
    canManage,
    target,
    operations: {
      overwrite: ({ selection, target }) =>
        appServerClient.mutations.SetSettings(
          { inputString: JSON.stringify({ overwrite: selection, target }) },
          { authMode: "userPool" },
        ),
      setMany: (input) =>
        appServerClient.mutations.SetSettings(
          { inputString: JSON.stringify(input) },
          { authMode: "userPool" },
        ),
      get: (input, authenticated) =>
        appServerClient.queries.GetSettings(
          { inputString: JSON.stringify(input) },
          { authMode: authenticated ? "userPool" : "apiKey" },
        ),
      set: (input) =>
        appServerClient.mutations.SetSettings(
          { inputString: JSON.stringify(input) },
          { authMode: "userPool" },
        ),
    },
  });
}
