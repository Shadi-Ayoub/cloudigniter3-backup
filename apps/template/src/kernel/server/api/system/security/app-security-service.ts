import "server-only";

import { ciCreateNextAwsSecurityAdministration } from "@cloudigniter/next/server";
import type { CiNextContext } from "@cloudigniter/next/types";

import outputs from "@/../amplify_outputs.json";
import { appAccessControl } from "@/custom/auth/app-access-control";
import { appServerClient } from "@/kernel/server/api/app-server-client";

/**
 * Composes the template's generated Amplify client with CloudIgniter security.
 *
 * Reusable ARBAC behavior is owned by EmberGuard/Core, AWS owns the provider
 * adapter, and the Next.js package binds both to the authenticated context.
 */
export function appCreateSecurityAdministration(context: CiNextContext) {
  return ciCreateNextAwsSecurityAdministration({
    context,
    definition: appAccessControl,
    amplifyOutputs: outputs,
    operations: {
      getDefinition: () =>
        appServerClient.queries.GetEmberguardDefinition(
          { inputString: JSON.stringify({}) },
          { authMode: "userPool" }
        ),
      saveDefinition: (inputString) =>
        appServerClient.mutations.SetEmberguardDefinition(
          { inputString },
          { authMode: "userPool" }
        ),
      listRoleAssignments: () =>
        appServerClient.queries.ListEmberguardRoleAssignments(
          { inputString: JSON.stringify({}) },
          { authMode: "userPool" }
        ),
      putRoleAssignment: (inputString) =>
        appServerClient.mutations.PutEmberguardRoleAssignment(
          { inputString },
          { authMode: "userPool" }
        ),
      deleteRoleAssignment: (inputString) =>
        appServerClient.mutations.DeleteEmberguardRoleAssignment(
          { inputString },
          { authMode: "userPool" }
        ),
    },
  });
}
