import { randomUUID } from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { CloudFormationClient } from "@aws-sdk/client-cloudformation";
import {
  ciCreateExtensionManager,
  ciCanAccessDeveloperTools,
  ciExtensionAccessControl,
} from "@cloudigniter/core/lib";
import type { CiExtensionCommand, CiResult } from "@cloudigniter/core/types";
import type {
  CiAppSyncResolverEvent,
  CiAwsExtensionHandlersOptions,
} from "@ci-aws/types";
import { ciCreateAwsExtensionStore } from "./ci-aws-extension-store";
import { ciCreateAwsExtensionProvider } from "./ci-aws-extension-provider";
import {
  ciCheckReadOnlyAccess,
  ciAuthorizeAwsAccess,
} from "../access-control/ci-check-read-only-access";

function actor(event: CiAppSyncResolverEvent) {
  const identity = event.identity as {
    sub?: string;
    claims?: Record<string, unknown>;
  } | null;
  const id = identity?.sub ?? identity?.claims?.sub;
  if (typeof id !== "string" || !id) throw new Error("Sign in to use modules.");
  const roles = identity?.claims?.["cognito:groups"];
  return {
    id,
    roles: Array.isArray(roles)
      ? roles.filter((role): role is string => typeof role === "string")
      : [],
  };
}
function input(event: CiAppSyncResolverEvent): Record<string, unknown> {
  const value = event.arguments?.inputString;
  if (typeof value !== "string" || Buffer.byteLength(value) > 32_000)
    throw new Error("Invalid module request.");
  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    throw new Error("Invalid module request.");
  return parsed as Record<string, unknown>;
}
async function result(
  operation: () => Promise<unknown>,
): Promise<CiResult<unknown>> {
  try {
    return { ok: true, statusCode: 200, body: await operation() };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Module operation failed.";
    // Do not expose SDK request metadata or credentials; keep uncertain operations retryable.
    return {
      ok: false,
      statusCode: 400,
      body: {
        error:
          error instanceof Error && error.name !== "Error"
            ? "The module backend could not complete the request. Refresh to check its state before retrying; inspect provider logs if it persists."
            : message,
      },
    };
  }
}

export function ciCreateAwsExtensionHandlers(
  options: CiAwsExtensionHandlersOptions,
) {
  const client =
    options.client ??
    DynamoDBDocumentClient.from(new DynamoDBClient({}), {
      marshallOptions: { removeUndefinedValues: true },
    });
  const store = () =>
    ciCreateAwsExtensionStore(client, process.env.CI_MODULES_TABLE_NAME ?? "");
  return {
    manage: (event: CiAppSyncResolverEvent) =>
      result(async () => {
        const user = actor(event);
        const manager = ciCreateExtensionManager({
          manifests: options.definitions.map((item) => item.manifest),
          host: { framework: options.framework, cloud: "aws" },
          store: store(),
          provider: ciCreateAwsExtensionProvider({
            client: options.cloudFormation ?? new CloudFormationClient({}),
            definitions: options.definitions,
            prefix: process.env.CI_MODULES_PREFIX ?? "",
            account: process.env.CI_MODULES_ACCOUNT ?? "",
            region: process.env.AWS_REGION ?? "",
            partition: process.env.CI_MODULES_PARTITION ?? "aws",
            serviceRoleArn: process.env.CI_MODULES_SERVICE_ROLE_ARN ?? "",
          }),
          authorize: async () => {
            if (
              !user.roles.includes("developer") ||
              !ciCanAccessDeveloperTools({
                envMode:
                  process.env.CI_ENV_MODE === "development"
                    ? "development"
                    : "production",
                actor: { authenticated: true, roles: user.roles },
              })
            )
              throw new Error(
                "Module management requires a developer in development mode.",
              );
            return user.id;
          },
          createOperationId: randomUUID,
        });
        const request = input(event);
        if (request.action === "list") return manager.list();
        await ciCheckReadOnlyAccess(
          event,
          [{ resource: "developer.tools", action: "execute" }],
          client,
        );
        return manager.execute(request as CiExtensionCommand);
      }),
    execute: (event: CiAppSyncResolverEvent) =>
      result(async () => {
        const user = actor(event);
        const request = input(event);
        if (request.action === "catalog") {
          const snapshot = await store().read();
          return options.definitions.flatMap((definition) => {
            const installed = snapshot.installations[definition.manifest.id];
            return installed?.status === "enabled" &&
              installed.manifest.version === definition.manifest.version
              ? [
                  {
                    manifest: definition.manifest,
                    configuration: installed.configuration,
                  },
                ]
              : [];
          });
        }
        if (typeof request.id !== "string") throw new Error("Select a module.");
        const definition = options.definitions.find(
          (item) => item.manifest.id === request.id,
        );
        const snapshot = await store().read();
        const installation = snapshot.installations[request.id];
        if (
          !definition ||
          !installation ||
          installation.status !== "enabled" ||
          installation.manifest.version !== definition.manifest.version
        )
          throw new Error(
            "This module is not enabled or its installed code is unavailable.",
          );
        if (!definition.execute)
          throw new Error("This module has no backend operations.");
        const tableName = installation.infrastructure.outputs?.TableName ?? "";
        if (
          installation.infrastructure.provider !== "none" &&
          (!tableName ||
            tableName !==
              `${process.env.CI_MODULES_PREFIX}-${definition.manifest.id}`)
        )
          throw new Error("Module resource binding is invalid.");
        return definition.execute(request.input, {
          actorId: user.id,
          moduleId: definition.manifest.id,
          tableName,
          controlTableName: process.env.CI_MODULES_TABLE_NAME!,
          snapshot,
          configuration: installation.configuration,
          client,
          assertAccess: (permission) =>
            ciAuthorizeAwsAccess(
              event,
              [
                {
                  resource: `module-${definition.manifest.id}.features`,
                  action: permission,
                },
              ],
              {
                extension: ciExtensionAccessControl([definition.manifest]),
                requireAllow: true,
                roleIds: definition.manifest.authenticatedAccess
                  ? [`module-${definition.manifest.id}-user`]
                  : [],
              },
              client,
            ),
        });
      }),
  };
}
