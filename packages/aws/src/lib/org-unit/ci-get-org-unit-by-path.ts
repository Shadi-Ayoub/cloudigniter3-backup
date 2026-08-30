import type { DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { ciNormalizePathname, ciResponseError, ciResponseOk } from "@cloudigniter/core/lib";
import type {
  CiGetOrgUnitByPathInterface,
  CiOrgUnitContext,
  CiResponse,
} from "@cloudigniter/core/types";
import {
  ciBuildOrgUnitTenantAttachmentKeys,
  ciOrgUnitAttachmentToContext,
  type CiStoredOrgUnitAttachment,
} from "./ci-org-unit-record";

export async function ciGetOrgUnitByPath(args: {
  tableName: string;
  clientConfig: DynamoDBClientConfig;
  input: CiGetOrgUnitByPathInterface;
}): Promise<CiResponse<{ exists: boolean; orgUnit?: CiOrgUnitContext }>> {
  try {
    const tenantId = args.input.tenantId.trim();
    const path = ciNormalizePathname(args.input.orgUnitPath);
    if (!tenantId || path === "/") {
      return ciResponseError(400, "Tenant ID and Org Unit path are required.");
    }
    const client = DynamoDBDocumentClient.from(
      new DynamoDBClient(args.clientConfig),
    );
    const response = await client.send(
      new GetCommand({
        TableName: args.tableName,
        Key: ciBuildOrgUnitTenantAttachmentKeys(tenantId, path),
        ConsistentRead: true,
      }),
    );
    if (!response.Item) return ciResponseOk({ exists: false });
    return ciResponseOk({
      exists: true,
      orgUnit: ciOrgUnitAttachmentToContext(
        response.Item as CiStoredOrgUnitAttachment,
      ),
    });
  } catch (error) {
    return ciResponseError(400, "Unable to resolve Org Unit.", {
      details: { message: error instanceof Error ? error.message : String(error) },
    });
  }
}
