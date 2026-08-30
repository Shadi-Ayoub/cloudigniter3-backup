import type { DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ciResponseError, ciResponseOk } from "@cloudigniter/core/lib";
import type {
  CiListOrgUnitsInput,
  CiListOrgUnitsResult,
  CiResponse,
} from "@cloudigniter/core/types";
import {
  CI_ORG_UNIT_COLLECTION_KEY,
  ciOrgUnitToManagementRow,
  type CiStoredOrgUnit,
} from "./ci-org-unit-record";

function encodeToken(key: Record<string, unknown> | undefined) {
  return key
    ? Buffer.from(JSON.stringify(key), "utf8").toString("base64url")
    : undefined;
}

function decodeToken(value: string | undefined) {
  if (!value) return undefined;
  const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid Org Unit list continuation token.");
  }
  return parsed as Record<string, unknown>;
}

export async function ciListOrgUnits(args: {
  tableName: string;
  clientConfig: DynamoDBClientConfig;
  input: CiListOrgUnitsInput;
}): Promise<CiResponse<CiListOrgUnitsResult>> {
  try {
    const client = DynamoDBDocumentClient.from(
      new DynamoDBClient(args.clientConfig),
    );
    const response = await client.send(
      new QueryCommand({
        TableName: args.tableName,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :collection",
        ExpressionAttributeValues: { ":collection": CI_ORG_UNIT_COLLECTION_KEY },
        ExclusiveStartKey: decodeToken(args.input.nextToken),
        Limit: Math.min(Math.max(args.input.limit ?? 100, 1), 100),
        ScanIndexForward: true,
      }),
    );
    return ciResponseOk({
      items: (response.Items ?? []).map((item) =>
        ciOrgUnitToManagementRow(item as CiStoredOrgUnit),
      ),
      count: response.Count ?? 0,
      nextToken: encodeToken(response.LastEvaluatedKey),
    });
  } catch (error) {
    return ciResponseError(400, "Unable to list Org Units.", {
      details: { message: error instanceof Error ? error.message : String(error) },
    });
  }
}
