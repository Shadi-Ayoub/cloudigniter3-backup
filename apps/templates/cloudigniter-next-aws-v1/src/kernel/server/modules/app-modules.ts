import "server-only";
import { ciCreateNextExtensionClient } from "@cloudigniter/next/server";
import type { CiNextContext } from "@cloudigniter/next/types";
import { extensionManifests } from "@/custom/modules/.generated/manifests";
import { appServerClient } from "../api/app-server-client";

export function appModules(context: CiNextContext) {
  return ciCreateNextExtensionClient({
    context,
    manifests: extensionManifests,
    host: { framework: "next", cloud: "aws" },
    operations: {
      ...(typeof appServerClient.mutations.ManageModules === "function"
        ? {
            manage: (input: Record<string, unknown>) =>
              appServerClient.mutations.ManageModules(
                { inputString: JSON.stringify(input) },
                { authMode: "userPool" },
              ),
          }
        : {}),
      ...(typeof appServerClient.mutations.ExecuteModule === "function"
        ? {
            execute: (input: Record<string, unknown>) =>
              appServerClient.mutations.ExecuteModule(
                { inputString: JSON.stringify(input) },
                { authMode: "userPool" },
              ),
          }
        : {}),
    },
  });
}
