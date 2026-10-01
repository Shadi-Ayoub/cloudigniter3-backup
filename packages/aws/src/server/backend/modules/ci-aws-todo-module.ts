import { randomUUID } from "node:crypto";
import {
  GetCommand,
  QueryCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  ciBuildTableKey,
  ciBuildTableKeys,
  ciParseTodoCommand,
} from "@cloudigniter/core/lib";
import type {
  CiExtensionManifest,
  CiTodoItem,
  CiTodoPage,
} from "@cloudigniter/core/types";
import type { CiAwsExtensionDefinition } from "@ci-aws/types";
import { ciAwsExtensionWriteGuard } from "./ci-aws-extension-write-guard";

/** Optional module resources use a separate lifecycle/restore boundary, with no indexes or scans. */
export function ciCreateAwsTodoModule(
  manifest: CiExtensionManifest,
): Required<CiAwsExtensionDefinition> {
  return {
    manifest,
    template: (tableName) => ({
      AWSTemplateFormatVersion: "2010-09-09",
      Resources: {
        Tasks: {
          Type: "AWS::DynamoDB::Table",
          DeletionPolicy: "Delete",
          UpdateReplacePolicy: "Retain",
          Properties: {
            TableName: tableName,
            BillingMode: "PAY_PER_REQUEST",
            TableClass: "STANDARD",
            AttributeDefinitions: [
              { AttributeName: "PK", AttributeType: "S" },
              { AttributeName: "SK", AttributeType: "S" },
            ],
            KeySchema: [
              { AttributeName: "PK", KeyType: "HASH" },
              { AttributeName: "SK", KeyType: "RANGE" },
            ],
            SSESpecification: { SSEEnabled: true },
          },
        },
      },
      Outputs: { TableName: { Value: { Ref: "Tasks" } } },
    }),
    async execute(value, context): Promise<CiTodoItem | CiTodoPage> {
      const input = ciParseTodoCommand(value);
      await context.assertAccess(
        input.action === "list" ? "read-own" : "write-own",
      );
      const partition = [
        "MODULE",
        context.moduleId,
        "USER",
        context.actorId,
      ] as const;
      const key = (id: string) =>
        ciBuildTableKeys({ partition, sort: ["TASK", id] });
      if (input.action === "list") {
        let cursor: string | undefined;
        if (input.nextToken) {
          cursor = Buffer.from(input.nextToken, "base64url").toString("utf8");
          if (!/^\d{13}-[a-f0-9-]{36}$/.test(cursor))
            throw new Error("Invalid task continuation token.");
        }
        const page = await context.client.send(
          new QueryCommand({
            TableName: context.tableName,
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
            ExpressionAttributeValues: {
              ":pk": ciBuildTableKey(...partition),
              ":prefix": ciBuildTableKey("TASK") + "#",
            },
            ConsistentRead: true,
            Limit: 50,
            ScanIndexForward: false,
            ...(cursor ? { ExclusiveStartKey: key(cursor) } : {}),
          }),
        );
        return {
          items: (page.Items ?? []).map((item) => item.task as CiTodoItem),
          ...(page.LastEvaluatedKey
            ? {
                nextToken: Buffer.from(
                  String(page.LastEvaluatedKey.SK).slice("CI#TASK#".length),
                ).toString("base64url"),
              }
            : {}),
        };
      }
      const now = new Date().toISOString();
      let task: CiTodoItem;
      if (input.action === "create") {
        task = {
          ...input.item,
          id: `${Date.now()}-${randomUUID()}`,
          completed: false,
          deleted: false,
          revision: 1,
          createdAt: now,
          updatedAt: now,
        };
      } else {
        const existing = await context.client.send(
          new GetCommand({
            TableName: context.tableName,
            Key: key(input.item.id),
            ConsistentRead: true,
          }),
        );
        if (!existing.Item?.task) throw new Error("Task not found.");
        const previous = existing.Item.task as CiTodoItem;
        if (
          previous.deleted &&
          (input.item.title !== previous.title ||
            input.item.notes !== previous.notes ||
            input.item.completed !== previous.completed ||
            input.item.priority !== previous.priority ||
            input.item.dueDate !== previous.dueDate)
        )
          throw new Error("Restore a task before editing it.");
        const { deletion: ignoredDeletion, ...editable } = input.item;
        task = {
          ...editable,
          revision: input.item.revision + 1,
          createdAt: previous.createdAt,
          updatedAt: now,
        };
        if (task.deleted)
          task.deletion = previous.deleted
            ? previous.deletion
            : {
                state: "deleted",
                operationId: randomUUID(),
                deletedAt: now,
                deletedBy: context.actorId,
                reason: "Moved to personal task trash",
              };
      }
      await context.client.send(
        new TransactWriteCommand({
          TransactItems: [
            ciAwsExtensionWriteGuard(context),
            {
              Put: {
                TableName: context.tableName,
                Item: { ...key(task.id), task, revision: task.revision },
                ConditionExpression:
                  input.action === "create"
                    ? "attribute_not_exists(PK)"
                    : "revision = :revision",
                ...(input.action === "save"
                  ? {
                      ExpressionAttributeValues: {
                        ":revision": input.item.revision,
                      },
                    }
                  : {}),
              },
            },
          ],
        }),
      );
      return task;
    },
  };
}
