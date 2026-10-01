import type { CiAwsExtensionExecutionContext } from "@ci-aws/types";
import { ciExtensionRegistryKey } from "./ci-aws-extension-store";

/** Include in the same DynamoDB transaction as module writes, after assertAccess. */
export function ciAwsExtensionWriteGuard(
  context: CiAwsExtensionExecutionContext,
) {
  return {
    ConditionCheck: {
      TableName: context.controlTableName,
      Key: ciExtensionRegistryKey(),
      ConditionExpression: "revision = :revision",
      ExpressionAttributeValues: { ":revision": context.snapshot.revision },
    },
  };
}
