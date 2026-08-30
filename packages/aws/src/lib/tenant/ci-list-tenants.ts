import type { DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ciResponseError, ciResponseOk } from "@cloudigniter/core/lib";
import type {
  CiListTenantsInput,
  CiListTenantsResult,
  CiResponse,
} from "@cloudigniter/core/types";
import {
  CI_TENANT_ACTIVE_PREFIX,
  CI_TENANT_COLLECTION_KEY,
  CI_TENANT_DELETED_PREFIX,
  ciTenantToTableRow,
  type CiStoredTenant,
} from "./ci-tenant-record";

function encodeNextToken(
  key: Record<string, unknown> | undefined,
): string | undefined {
  return key
    ? Buffer.from(JSON.stringify(key), "utf8").toString("base64url")
    : undefined;
}

function decodeNextToken(
  value: string | undefined,
): Record<string, unknown> | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : undefined;
  } catch {
    throw new Error("Invalid tenant list continuation token.");
  }
}

export async function ciListTenants(args: {
  tableName: string;
  clientConfig: DynamoDBClientConfig;
  input: CiListTenantsInput;
}): Promise<CiResponse<CiListTenantsResult>> {
  try {
    const state = args.input.deletionState ?? "active";
    const limit = Math.min(Math.max(args.input.limit ?? 50, 1), 100);
    const client = DynamoDBDocumentClient.from(
      new DynamoDBClient(args.clientConfig),
    );
    const response = await client.send(
      new QueryCommand({
        TableName: args.tableName,
        IndexName: "GSI1",
        KeyConditionExpression:
          "GSI1PK = :collection AND begins_with(GSI1SK, :state)",
        ExpressionAttributeValues: {
          ":collection": CI_TENANT_COLLECTION_KEY,
          ":state":
            state === "deleted"
              ? CI_TENANT_DELETED_PREFIX
              : CI_TENANT_ACTIVE_PREFIX,
        },
        ExclusiveStartKey: decodeNextToken(args.input.nextToken),
        Limit: limit,
        ScanIndexForward: state !== "deleted",
      }),
    );

    return ciResponseOk({
      items: (response.Items ?? []).map((item) =>
        ciTenantToTableRow(item as CiStoredTenant),
      ),
      count: response.Count ?? 0,
      nextToken: encodeNextToken(response.LastEvaluatedKey),
    });
  } catch (error) {
    return ciResponseError(400, "Unable to list tenants.", {
      details: {
        message: error instanceof Error ? error.message : String(error),
      },
    });
  }
}
