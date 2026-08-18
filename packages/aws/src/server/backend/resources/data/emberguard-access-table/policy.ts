import type { CiPlanOptions, CiPolicyFragment } from "../../../types";
import type { CiTableResourceState } from "../../resource-types";

const readHandlers = [
  "ciListEmberguardRoleAssignmentsHandler",
  "ciListEmberguardResourceInventoryHandler",
  "ciListEmberguardCustomDomainsHandler",
] as const;

const ordinaryWriteHandlers = [
  "ciPutEmberguardResourceInventoryHandler",
  "ciPutEmberguardCustomDomainHandler",
] as const;

const ordinaryDeleteHandlers = [
  "ciDeleteEmberguardCustomDomainHandler",
] as const;

const assignmentMutationHandlers = [
  "ciPutEmberguardRoleAssignmentHandler",
  "ciDeleteEmberguardRoleAssignmentHandler",
] as const;

export function ciMakeEmberguardAccessTablePolicies(
  tables: { emberguardAccess: CiTableResourceState },
  options: CiPlanOptions,
): CiPolicyFragment {
  if (!options.includeDefaultDynamoPolicies) return {};

  return {
    inlinePolicies: [
      ...readHandlers.map((handlerId) => ({
        for: handlerId,
        id: "EmberguardAccessDdbRead",
        statements: [
          {
            effect: "Allow" as const,
            actions: ["dynamodb:GetItem", "dynamodb:Query"],
            resources: [
              tables.emberguardAccess.arn,
              `${tables.emberguardAccess.arn}/index/*`,
            ],
          },
        ],
      })),
      {
        for: "ciGetEmberguardDefinitionHandler",
        id: "EmberguardAccessDdbReadOrInitialize",
        statements: [
          {
            effect: "Allow" as const,
            actions: ["dynamodb:GetItem", "dynamodb:Query", "dynamodb:PutItem"],
            resources: [tables.emberguardAccess.arn],
          },
        ],
      },
      ...ordinaryWriteHandlers.map((handlerId) => ({
        for: handlerId,
        id: "EmberguardAccessDdbWrite",
        statements: [
          {
            effect: "Allow" as const,
            actions: ["dynamodb:PutItem", "dynamodb:UpdateItem"],
            resources: [tables.emberguardAccess.arn],
          },
        ],
      })),
      ...ordinaryDeleteHandlers.map((handlerId) => ({
        for: handlerId,
        id: "EmberguardAccessDdbDelete",
        statements: [
          {
            effect: "Allow" as const,
            actions: ["dynamodb:DeleteItem"],
            resources: [tables.emberguardAccess.arn],
          },
        ],
      })),
      {
        for: "ciSetEmberguardDefinitionHandler",
        id: "EmberguardAccessDdbDefinitionWrite",
        statements: [
          {
            effect: "Allow" as const,
            actions: [
              "dynamodb:GetItem",
              "dynamodb:Query",
              "dynamodb:PutItem",
              "dynamodb:TransactWriteItems",
            ],
            resources: [tables.emberguardAccess.arn],
          },
        ],
      },
      ...assignmentMutationHandlers.map((handlerId) => ({
        for: handlerId,
        id: "EmberguardAccessDdbAssignmentTransaction",
        statements: [
          {
            effect: "Allow" as const,
            actions: [
              "dynamodb:GetItem",
              "dynamodb:Query",
              "dynamodb:PutItem",
              "dynamodb:DeleteItem",
              "dynamodb:TransactWriteItems",
            ],
            resources: [tables.emberguardAccess.arn],
          },
        ],
      })),
    ],
  };
}
