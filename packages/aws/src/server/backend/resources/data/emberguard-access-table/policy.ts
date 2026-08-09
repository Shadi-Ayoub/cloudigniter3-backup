import type { CiPlanOptions, CiPolicyFragment } from "../../../types";
import type { CiTableResourceState } from "../../resource-types";

const readHandlers = [
  "ciGetEmberguardDefinitionHandler",
  "ciListEmberguardRoleAssignmentsHandler",
  "ciListEmberguardResourceInventoryHandler",
  "ciListEmberguardCustomDomainsHandler",
] as const;

const writeHandlers = [
  "ciSetEmberguardDefinitionHandler",
  "ciPutEmberguardRoleAssignmentHandler",
  "ciPutEmberguardResourceInventoryHandler",
  "ciPutEmberguardCustomDomainHandler",
] as const;

const deleteHandlers = [
  "ciDeleteEmberguardRoleAssignmentHandler",
  "ciDeleteEmberguardCustomDomainHandler",
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
      ...writeHandlers.map((handlerId) => ({
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
      ...deleteHandlers.map((handlerId) => ({
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
    ],
  };
}
