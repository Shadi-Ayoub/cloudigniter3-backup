import {
  GetCommand,
  QueryCommand,
  type DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";
import type {
  CiSettingsTarget,
  CiSettingsTargetPage,
} from "@cloudigniter/core/types";
import {
  ciBuildTenantPrimaryKey,
  CI_TENANT_ACTIVE_PREFIX,
  CI_TENANT_COLLECTION_KEY,
} from "../../../../lib/tenant/ci-tenant-record";

/** GSI discovery is for the selector only. Every target operation rechecks its base record. */
export function ciSettingsTargets(
  client: DynamoDBDocumentClient,
  tableName: string,
) {
  return {
    async validate(target: CiSettingsTarget) {
      if (target.scope !== "tenant") return;
      if (!tableName) throw new Error("Tenant storage is not configured.");
      const { Item: item } = await client.send(
        new GetCommand({
          TableName: tableName,
          Key: ciBuildTenantPrimaryKey(target.tenantId),
          ConsistentRead: true,
        }),
      );
      if (
        !item ||
        item.tenantId !== target.tenantId ||
        item.data?.isSystem ||
        item.deletionState === "deleted" ||
        item.status !== "active"
      )
        throw new Error("The settings tenant is unavailable.");
    },
    async list(nextToken?: string): Promise<CiSettingsTargetPage> {
      if (!tableName) throw new Error("Tenant storage is not configured.");
      let cursor: Record<string, string> | undefined;
      if (nextToken !== undefined) {
        if (typeof nextToken !== "string" || nextToken.length > 4096)
          throw new Error("Invalid tenant continuation token.");
        const parsed = JSON.parse(
          Buffer.from(nextToken, "base64url").toString("utf8"),
        );
        if (
          !parsed ||
          typeof parsed !== "object" ||
          Array.isArray(parsed) ||
          Object.keys(parsed).length !== 4 ||
          !["PK", "SK", "GSI1PK", "GSI1SK"].every(
            (key) => typeof parsed[key] === "string",
          ) ||
          parsed.GSI1PK !== CI_TENANT_COLLECTION_KEY ||
          !parsed.GSI1SK.startsWith(CI_TENANT_ACTIVE_PREFIX)
        )
          throw new Error("Invalid tenant continuation token.");
        cursor = parsed;
      }
      const result = await client.send(
        new QueryCommand({
          TableName: tableName,
          IndexName: "GSI1",
          KeyConditionExpression:
            "GSI1PK = :collection AND begins_with(GSI1SK, :state)",
          ExpressionAttributeValues: {
            ":collection": CI_TENANT_COLLECTION_KEY,
            ":state": CI_TENANT_ACTIVE_PREFIX,
          },
          Limit: 50,
          ExclusiveStartKey: cursor,
        }),
      );
      return {
        items: [
          ...(!nextToken
            ? [{ target: { scope: "global" as const }, label: "GLOBAL" }]
            : []),
          ...(result.Items ?? [])
            .filter(
              (item) =>
                !item.data?.isSystem &&
                item.deletionState !== "deleted" &&
                item.status === "active" &&
                typeof item.tenantId === "string",
            )
            .map((item) => ({
              target: {
                scope: "tenant" as const,
                tenantId: String(item.tenantId),
              },
              label: String(item.name ?? item.tenantId),
            })),
        ],
        ...(result.LastEvaluatedKey
          ? {
              nextToken: Buffer.from(
                JSON.stringify(result.LastEvaluatedKey),
              ).toString("base64url"),
            }
          : {}),
      };
    },
  };
}
