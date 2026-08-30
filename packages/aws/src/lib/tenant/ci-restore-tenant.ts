import type { DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { ciResponseError, ciResponseOk } from "@cloudigniter/core/lib";
import type {
  CiResponse,
  CiRestoreTenantInput,
  CiTenantLifecycleResult,
} from "@cloudigniter/core/types";
import {
  CI_TENANT_COLLECTION_KEY,
  ciBuildTenantActiveSortKey,
  ciBuildTenantPrimaryKey,
  ciBuildTenantSlugKeys,
  ciRequireLifecycleReason,
  ciTenantToTableRow,
  type CiStoredTenant,
} from "./ci-tenant-record";

export type CiRestoreTenantServiceInput = CiRestoreTenantInput & {
  actorId: string;
  operationId: string;
  now: string;
};

export async function ciRestoreTenant(args: {
  tableName: string;
  clientConfig: DynamoDBClientConfig;
  input: CiRestoreTenantServiceInput;
}): Promise<CiResponse<CiTenantLifecycleResult>> {
  try {
    ciRequireLifecycleReason(args.input.reason);
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
    const tenant = current.Item as CiStoredTenant | undefined;
    if (!tenant)
      return ciResponseError(
        404,
        `Tenant "${args.input.tenantId}" was not found.`,
      );
    if (tenant.deletionState !== "deleted")
      return ciResponseError(
        409,
        `Tenant "${args.input.tenantId}" is not in Trash.`,
      );
    const slug = tenant.data?.slug;
    if (!slug)
      return ciResponseError(
        409,
        "The tenant cannot be restored because its slug is missing.",
      );
    const slugKeys = ciBuildTenantSlugKeys(args.input.tenantId, slug);

    const response = await client.send(
      new UpdateCommand({
        TableName: args.tableName,
        Key: key,
        ConditionExpression: "deletionState = :deleted",
        UpdateExpression:
          "SET deletionState = :active, GSI1PK = :collection, GSI1SK = :gsi1sk, GSI2PK = :gsi2pk, GSI2SK = :gsi2sk, updatedAt = :now, version = if_not_exists(version, :zero) + :one REMOVE deletion",
        ExpressionAttributeValues: {
          ":deleted": "deleted",
          ":active": "active",
          ":collection": CI_TENANT_COLLECTION_KEY,
          ":gsi1sk": ciBuildTenantActiveSortKey(
            tenant.tenantId,
            tenant.createdAt,
          ),
          ":gsi2pk": slugKeys.GSI2PK,
          ":gsi2sk": slugKeys.GSI2SK,
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
    return ciResponseError(409, "Unable to restore tenant.", {
      details: {
        message: error instanceof Error ? error.message : String(error),
      },
    });
  }
}
