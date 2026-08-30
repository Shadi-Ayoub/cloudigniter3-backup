import type { DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { ciResponseError, ciResponseOk } from "@cloudigniter/core/lib";
import type { CiPurgeTenantInput, CiResponse } from "@cloudigniter/core/types";
import {
  ciAssertTenantMutable,
  ciBuildTenantPrimaryKey,
  ciRequireLifecycleReason,
  type CiStoredTenant,
} from "./ci-tenant-record";

export type CiPurgeTenantServiceInput = CiPurgeTenantInput & {
  actorId: string;
  operationId: string;
  now: string;
};

export async function ciPurgeTenant(args: {
  tableName: string;
  clientConfig: DynamoDBClientConfig;
  input: CiPurgeTenantServiceInput;
}): Promise<CiResponse<{ purged: true; tenantId: string }>> {
  try {
    ciRequireLifecycleReason(args.input.reason);
    if (args.input.confirmation !== args.input.tenantId) {
      return ciResponseError(
        400,
        "Permanent deletion confirmation must match the tenant ID.",
      );
    }
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
    ciAssertTenantMutable(tenant);
    if (tenant.deletionState !== "deleted")
      return ciResponseError(
        409,
        "A tenant must be in Trash before it can be permanently deleted.",
      );

    await client.send(
      new DeleteCommand({
        TableName: args.tableName,
        Key: key,
        ConditionExpression: "deletionState = :deleted",
        ExpressionAttributeValues: { ":deleted": "deleted" },
      }),
    );
    return ciResponseOk({ purged: true, tenantId: args.input.tenantId });
  } catch (error) {
    return ciResponseError(409, "Unable to permanently delete tenant.", {
      details: {
        message: error instanceof Error ? error.message : String(error),
      },
    });
  }
}
