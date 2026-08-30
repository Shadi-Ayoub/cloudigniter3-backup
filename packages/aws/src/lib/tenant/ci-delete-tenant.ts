import type { DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { ciResponseError, ciResponseOk } from "@cloudigniter/core/lib";
import type {
  CiDeleteTenantInput,
  CiResponse,
  CiTenantLifecycleResult,
} from "@cloudigniter/core/types";
import {
  CI_TENANT_COLLECTION_KEY,
  ciAssertTenantMutable,
  ciBuildTenantDeletedSortKey,
  ciBuildTenantPrimaryKey,
  ciRequireLifecycleReason,
  ciTenantToTableRow,
  type CiStoredTenant,
} from "./ci-tenant-record";

export type CiDeleteTenantServiceInput = CiDeleteTenantInput & {
  actorId: string;
  operationId: string;
  now: string;
};

export async function ciDeleteTenant(args: {
  tableName: string;
  clientConfig: DynamoDBClientConfig;
  input: CiDeleteTenantServiceInput;
}): Promise<CiResponse<CiTenantLifecycleResult>> {
  try {
    const reason = ciRequireLifecycleReason(args.input.reason);
    const key = ciBuildTenantPrimaryKey(args.input.tenantId);
    const client = DynamoDBDocumentClient.from(
      new DynamoDBClient(args.clientConfig),
    );
    const current = await client.send(
      new GetCommand({
        TableName: args.tableName,
        Key: key,
        ConsistentRead: true,
      }),
    );
    if (!current.Item)
      return ciResponseError(
        404,
        `Tenant "${args.input.tenantId}" was not found.`,
      );
    ciAssertTenantMutable(current.Item as CiStoredTenant);

    const response = await client.send(
      new UpdateCommand({
        TableName: args.tableName,
        Key: key,
        ConditionExpression:
          "attribute_exists(PK) AND (attribute_not_exists(deletionState) OR deletionState <> :deleted)",
        UpdateExpression:
          "SET deletionState = :deleted, deletion = :deletion, GSI1PK = :collection, GSI1SK = :gsi1sk, updatedAt = :now, version = if_not_exists(version, :zero) + :one REMOVE GSI2PK, GSI2SK",
        ExpressionAttributeValues: {
          ":deleted": "deleted",
          ":deletion": {
            state: "deleted",
            operationId: args.input.operationId,
            deletedAt: args.input.now,
            deletedBy: args.input.actorId,
            reason,
          },
          ":collection": CI_TENANT_COLLECTION_KEY,
          ":gsi1sk": ciBuildTenantDeletedSortKey(
            args.input.tenantId,
            args.input.now,
          ),
          ":now": args.input.now,
          ":zero": 0,
          ":one": 1,
        },
        ReturnValues: "ALL_NEW",
      }),
    );
    return ciResponseOk({
      tenant: ciTenantToTableRow(response.Attributes as CiStoredTenant),
    });
  } catch (error) {
    return ciResponseError(409, "Unable to move tenant to Trash.", {
      details: {
        message: error instanceof Error ? error.message : String(error),
      },
    });
  }
}
