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
  CiSetTenantStatusInput,
  CiTenantLifecycleResult,
} from "@cloudigniter/core/types";
import {
  ciAssertTenantOperationalStatusMutable,
  ciBuildTenantPrimaryKey,
  ciRequireTenantStatusReason,
  ciTenantToTableRow,
  type CiStoredTenant,
} from "./ci-tenant-record";

export type CiSetTenantStatusServiceInput = CiSetTenantStatusInput & {
  actorId: string;
  now: string;
};

/** Conditionally suspends or activates an existing, non-deleted tenant. */
export async function ciSetTenantStatus(args: {
  tableName: string;
  clientConfig: DynamoDBClientConfig;
  input: CiSetTenantStatusServiceInput;
}): Promise<CiResponse<CiTenantLifecycleResult>> {
  try {
    if (
      args.input.status !== "active" &&
      args.input.status !== "suspended"
    ) {
      return ciResponseError(
        400,
        "Tenant status must be active or suspended.",
      );
    }
    const reason = ciRequireTenantStatusReason(args.input.reason);
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
    if (!tenant) {
      return ciResponseError(
        404,
        `Tenant "${args.input.tenantId}" was not found.`,
      );
    }
    ciAssertTenantOperationalStatusMutable(tenant);
    if (tenant.deletionState === "deleted") {
      return ciResponseError(
        409,
        `Tenant "${args.input.tenantId}" must be restored before its operational status can change.`,
      );
    }
    if (tenant.status === args.input.status) {
      return ciResponseError(
        409,
        `Tenant "${args.input.tenantId}" is already ${args.input.status}.`,
      );
    }

    const response = await client.send(
      new UpdateCommand({
        TableName: args.tableName,
        Key: key,
        ConditionExpression:
          "attribute_exists(PK) AND (attribute_not_exists(deletionState) OR deletionState <> :deleted) AND #status = :previousStatus",
        UpdateExpression:
          "SET #status = :status, statusTransition = :transition, updatedAt = :now, version = if_not_exists(version, :zero) + :one",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: {
          ":deleted": "deleted",
          ":previousStatus": tenant.status,
          ":status": args.input.status,
          ":transition": {
            status: args.input.status,
            changedAt: args.input.now,
            changedBy: args.input.actorId,
            reason,
          },
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
    return ciResponseError(409, "Unable to update tenant status.", {
      details: {
        message: error instanceof Error ? error.message : String(error),
      },
    });
  }
}
