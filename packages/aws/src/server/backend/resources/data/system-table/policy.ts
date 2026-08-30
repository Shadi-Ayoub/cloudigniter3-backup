import type { CiPlanOptions, CiPolicyFragment } from "../../../types";
import type { CiTableResourceState } from "../../resource-types";

export function ciMakeSystemTablePolicies(
  tables: { system: CiTableResourceState },
  options: CiPlanOptions,
): CiPolicyFragment {
  if (!options.includeDefaultDynamoPolicies) return {};

  return {
    // DynamoDB transaction authorization requires TransactWriteItems plus the
    // action matching every ConditionCheck, Put, Update, or Delete component.
    inlinePolicies: [
      {
        for: "ciSeedTenantsHandler",
        id: "SystemDdbSeedTenants",
        statements: [
          {
            effect: "Allow",
            actions: [
              "dynamodb:ConditionCheckItem",
              "dynamodb:GetItem",
              "dynamodb:PutItem",
              "dynamodb:TransactWriteItems",
              "dynamodb:UpdateItem",
            ],
            resources: [tables.system.arn],
          },
        ],
      },
      {
        for: "ciCleanupSeededTenantsHandler",
        id: "SystemDdbCleanupSeededTenants",
        statements: [
          {
            effect: "Allow",
            actions: [
              "dynamodb:GetItem",
              "dynamodb:Query",
              "dynamodb:DeleteItem",
              "dynamodb:TransactWriteItems",
              "dynamodb:UpdateItem",
            ],
            resources: [tables.system.arn],
          },
        ],
      },
      {
        for: "ciDeleteTenantHandler",
        id: "SystemDdbReadWrite",
        statements: [
          {
            effect: "Allow",
            actions: ["dynamodb:GetItem", "dynamodb:UpdateItem"],
            resources: [tables.system.arn],
          },
        ],
      },
      {
        for: "ciListTenantsHandler",
        id: "SystemDdbReadOnly",
        statements: [
          {
            effect: "Allow",
            actions: ["dynamodb:Query"],
            resources: [tables.system.arn, `${tables.system.arn}/index/GSI1`],
          },
        ],
      },
      {
        for: "ciRestoreTenantHandler",
        id: "SystemDdbReadWrite",
        statements: [
          {
            effect: "Allow",
            actions: ["dynamodb:GetItem", "dynamodb:UpdateItem"],
            resources: [tables.system.arn],
          },
        ],
      },
      {
        for: "ciPurgeTenantHandler",
        id: "SystemDdbReadWrite",
        statements: [
          {
            effect: "Allow",
            actions: ["dynamodb:GetItem", "dynamodb:DeleteItem"],
            resources: [tables.system.arn],
          },
        ],
      },
      {
        for: "ciSetTenantStatusHandler",
        id: "SystemDdbReadWrite",
        statements: [
          {
            effect: "Allow",
            actions: ["dynamodb:GetItem", "dynamodb:UpdateItem"],
            resources: [tables.system.arn],
          },
        ],
      },
      {
        for: "ciCreateOrgUnitHandler",
        id: "SystemDdbCreateOrgUnit",
        statements: [
          {
            effect: "Allow",
            actions: [
              "dynamodb:ConditionCheckItem",
              "dynamodb:GetItem",
              "dynamodb:PutItem",
              "dynamodb:TransactWriteItems",
              "dynamodb:UpdateItem",
            ],
            resources: [tables.system.arn],
          },
        ],
      },
      {
        for: "ciGetOrgUnitByPathHandler",
        id: "SystemDdbGetOrgUnitByPath",
        statements: [
          {
            effect: "Allow",
            actions: ["dynamodb:GetItem"],
            resources: [tables.system.arn],
          },
        ],
      },
      {
        for: "ciListOrgUnitsHandler",
        id: "SystemDdbListOrgUnits",
        statements: [
          {
            effect: "Allow",
            actions: ["dynamodb:Query"],
            resources: [tables.system.arn, `${tables.system.arn}/index/GSI1`],
          },
        ],
      },
      {
        for: "ciUpdateOrgUnitHandler",
        id: "SystemDdbUpdateOrgUnit",
        statements: [
          {
            effect: "Allow",
            actions: [
              "dynamodb:GetItem",
              "dynamodb:BatchGetItem",
              "dynamodb:ConditionCheckItem",
              "dynamodb:DeleteItem",
              "dynamodb:PutItem",
              "dynamodb:TransactWriteItems",
              "dynamodb:UpdateItem",
            ],
            resources: [tables.system.arn],
          },
        ],
      },
    ],
    tableGrants: [],
  };
}
