import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
  ciBuildTableKey,
  ciBuildTableKeys,
  ciCreateAuthorizer,
  ciCreateAuthorizationSubject,
  ciCreateRoleAssignments,
  ciCreateSettingsManager,
  ciSystemAccessScope,
  ciParseSettingsTarget,
  ciCanManageSettings,
} from "@cloudigniter/core/lib";
import type {
  CiAccessControlDefinition,
  CiSecurityStoredRoleAssignment,
  CiSettingsTarget,
  CiSettingsManagementAction,
  CiSettingsUpdate,
  CiSettingsOverwriteSelection,
} from "@cloudigniter/core/types";
import type {
  CiAppSyncResolverEvent,
  CiAwsSettingsHandlerOptions,
} from "@ci-aws/types";
import { CI_ENV } from "../../env/env.keys";
import { ciCreateAwsSettingsStore } from "./ci-settings-store";
import { ciSettingsTargets } from "./ci-settings-targets";

function parseInput(value: unknown, write: boolean) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid settings request.");
  const input = value as Record<string, unknown>;
  const allowed = write
    ? ["id", "value", "revision", "systemRevision", "enforcement"]
    : ["id", "manage"];
  if (
    Object.keys(input).some((key) => !allowed.includes(key)) ||
    typeof input.id !== "string" ||
    !input.id
  )
    throw new Error("Invalid settings request fields.");
  if (input.manage !== undefined && typeof input.manage !== "boolean")
    throw new Error("Invalid management flag.");
  if (
    write &&
    (typeof input.revision !== "number" ||
      !Number.isSafeInteger(input.revision) ||
      input.revision < 0)
  )
    throw new Error("Invalid settings revision.");
  return {
    id: input.id,
    value: input.value,
    revision: input.revision as number,
    manage: input.manage === true,
    ...(input.systemRevision !== undefined
      ? { systemRevision: input.systemRevision as number }
      : {}),
    ...(input.enforcement !== undefined
      ? { enforcement: input.enforcement as CiSettingsUpdate["enforcement"] }
      : {}),
  };
}

/** AppSync identities are trusted; owner/scope/role fields in request input are rejected. */
export function ciCreateAwsSettingsHandlers(
  options: CiAwsSettingsHandlerOptions,
) {
  const client =
    options.client ??
    DynamoDBDocumentClient.from(
      new DynamoDBClient({
        region: process.env[CI_ENV.CI_REGION] ?? process.env.AWS_REGION,
      }),
      { marshallOptions: { removeUndefinedValues: true } },
    );
  const store = ciCreateAwsSettingsStore({
    client,
    tables: {
      public: process.env[CI_ENV.CI_PUBLIC_SETTINGS_TABLE_NAME] ?? "",
      private: process.env[CI_ENV.CI_PRIVATE_SETTINGS_TABLE_NAME] ?? "",
      user: process.env[CI_ENV.CI_USER_SETTINGS_TABLE_NAME] ?? "",
    },
  });
  const targets = ciSettingsTargets(
    client,
    process.env[CI_ENV.CI_SYSTEM_TABLE_NAME] ?? "",
  );
  function manager(event: CiAppSyncResolverEvent, target: CiSettingsTarget) {
    const identity = event.identity as {
      sub?: string;
      claims?: Record<string, unknown>;
    } | null;
    const claims = identity?.claims ?? {};
    const sub = identity?.sub ?? claims.sub;
    const id = typeof sub === "string" && sub ? sub : null;
    const rawGroups = claims["cognito:groups"];
    const groups = Array.isArray(rawGroups)
      ? rawGroups.filter((value): value is string => typeof value === "string")
      : [];
    let authorization:
      Promise<ReturnType<typeof ciCreateAuthorizer>> | undefined;
    let assignments: CiSecurityStoredRoleAssignment[] = [];
    async function canManage(
      action: CiSettingsManagementAction,
      boundary: CiSettingsTarget = target,
    ) {
      if (!id) return false;
      if (action === "enforce" && boundary.scope !== "system") return false;
      authorization ??= (async () => {
        const table = process.env[CI_ENV.CI_EMBERGUARD_ACCESS_TABLE_NAME];
        if (!table)
          throw new Error("Settings authorization storage is not configured.");
        const result = await client.send(
          new GetCommand({
            TableName: table,
            Key: ciBuildTableKeys({
              partition: ["EMBERGUARD", "ACCESS_CONTROL"],
              sort: ["DEFINITION", "ACTIVE"],
            }),
            ConsistentRead: true,
          }),
        );
        const definition: CiAccessControlDefinition = result.Item
          ? result.Item.state?.definition
          : CI_DEFAULT_ACCESS_CONTROL_DEFINITION;
        if (!definition)
          throw new Error("Invalid settings authorization catalog.");
        let cursor: Record<string, unknown> | undefined;
        let pages = 0;
        do {
          const page = await client.send(
            new QueryCommand({
              TableName: table,
              KeyConditionExpression: "PK = :pk",
              ExpressionAttributeValues: {
                ":pk": ciBuildTableKey(
                  "EMBERGUARD",
                  "SUBJECT",
                  id,
                  "ROLE_ASSIGNMENTS",
                ),
              },
              ConsistentRead: true,
              Limit: 100,
              ExclusiveStartKey: cursor,
            }),
          );
          assignments.push(
            ...((page.Items ?? []) as CiSecurityStoredRoleAssignment[]),
          );
          cursor = page.LastEvaluatedKey;
          if (++pages > 20)
            throw new Error("Too many settings authorization assignments.");
        } while (cursor);
        return ciCreateAuthorizer(definition);
      })();
      const authorizer = await authorization;
      const now = Date.now();
      const active = assignments.filter(
        (item) =>
          item.subjectId === id &&
          (!item.validFrom || Date.parse(item.validFrom) <= now) &&
          (!item.expiresAt || Date.parse(item.expiresAt) > now),
      );
      return ciCanManageSettings(
        authorizer,
        ciCreateAuthorizationSubject({ id, authenticated: true }, [
          ...ciCreateRoleAssignments(groups, ciSystemAccessScope(), "exact"),
          ...active,
        ]),
        action,
        boundary,
      );
    }
    return {
      settings: ciCreateSettingsManager({
        registry: options.registry,
        store,
        actor: { id, authenticated: !!id },
        canManage,
        target,
        validateTarget: targets.validate,
      }),
      canManage,
    };
  }
  async function execute(event: CiAppSyncResolverEvent, write: boolean) {
    try {
      const raw = String(event.arguments?.inputString ?? "{}");
      if (Buffer.byteLength(raw) > 300_000)
        throw new Error("Settings request is too large.");
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
        throw new Error("Invalid settings request.");
      const target = ciParseSettingsTarget(parsed.target);
      const { target: ignoredTarget, ...args } = parsed;
      const { settings, canManage } = manager(event, target);
      if (write) {
        if (args.overwrite !== undefined) {
          if (
            Object.keys(args).length !== 1 ||
            !Array.isArray(args.overwrite) ||
            !args.overwrite.length ||
            args.overwrite.length > 50
          )
            throw new Error(
              "Select between 1 and 50 settings groups to overwrite.",
            );
          const selection: CiSettingsOverwriteSelection[] = args.overwrite.map(
            (item: unknown) => {
              if (
                !item ||
                typeof item !== "object" ||
                Array.isArray(item) ||
                Object.keys(item).length !== 3 ||
                !("id" in item) ||
                typeof item.id !== "string" ||
                !("fields" in item) ||
                !("systemRevision" in item) ||
                typeof item.systemRevision !== "number" ||
                !Number.isSafeInteger(item.systemRevision) ||
                item.systemRevision < 0
              )
                throw new Error("Invalid overwrite selection.");
              return {
                id: item.id,
                fields: item.fields as CiSettingsOverwriteSelection["fields"],
                systemRevision: item.systemRevision,
              };
            },
          );
          return {
            ok: true,
            statusCode: 200,
            body: { groups: await settings.overwrite(selection) },
          };
        }
        if (args && typeof args === "object" && "groups" in args) {
          if (
            Object.keys(args).length !== 1 ||
            !Array.isArray(args.groups) ||
            !args.groups.length ||
            args.groups.length > 100
          )
            throw new Error("Provide between 1 and 100 settings groups.");
          const updates = args.groups.map((value: unknown) => {
            const input = parseInput(value, true);
            return {
              id: input.id,
              value: input.value,
              revision: input.revision,
              ...(input.systemRevision !== undefined
                ? { systemRevision: input.systemRevision }
                : {}),
              ...(input.enforcement !== undefined
                ? { enforcement: input.enforcement }
                : {}),
            };
          });
          return {
            ok: true,
            statusCode: 200,
            body: { groups: await settings.saveAll(updates) },
          };
        }
        const input = parseInput(args, true);
        return {
          ok: true,
          statusCode: 200,
          body: await settings.save(input.id, input.value, input.revision, {
            ...(input.systemRevision !== undefined
              ? { systemRevision: input.systemRevision }
              : {}),
            ...(input.enforcement !== undefined
              ? { enforcement: input.enforcement }
              : {}),
          }),
        };
      }
      if (args.targets !== undefined) {
        if (
          args.targets !== true ||
          Object.keys(args).some(
            (key) => !["targets", "nextToken"].includes(key),
          ) ||
          !(await canManage("read", { scope: "system" }))
        )
          throw new Error(
            "System settings read permission is required to list tenants.",
          );
        return {
          ok: true,
          statusCode: 200,
          body: await targets.list(args.nextToken),
        };
      }
      if (args?.access !== undefined) {
        if (args.access !== true || Object.keys(args).length !== 1)
          throw new Error("Invalid settings access request.");
        await targets.validate(target);
        return {
          ok: true,
          statusCode: 200,
          body: {
            read: await canManage("read"),
            update: await canManage("update"),
            enforce: target.scope === "system" && (await canManage("enforce")),
            overwrite:
              target.scope === "system" && (await canManage("overwrite")),
          },
        };
      }
      const input = parseInput(args, false);
      if (
        input.manage &&
        options.registry.get(input.id).scope !== "user" &&
        !(await canManage("read"))
      )
        return {
          ok: false,
          statusCode: 403,
          body: { error: "Settings management access is required." },
        };
      const group = await settings.read(input.id);
      // Target lists and enforcement rules are management metadata, not public settings values.
      if (!input.manage) delete group.enforcement;
      return { ok: true, statusCode: 200, body: group };
    } catch (error) {
      // Never log settings values, cookies, identities, or arbitrary provider diagnostics.
      return {
        ok: false,
        statusCode: 400,
        body: {
          error:
            error instanceof Error ? error.message : "Settings request failed.",
        },
      };
    }
  }
  return {
    get: (event: CiAppSyncResolverEvent) => execute(event, false),
    set: (event: CiAppSyncResolverEvent) => execute(event, true),
  };
}
