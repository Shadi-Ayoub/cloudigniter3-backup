import type { CiPlanOptions, CiPolicyFragment } from '../../../types';
import type { CiTableResourceState } from '../../resource-types';

export function ciMakeSystemTablePolicies(
  tables: { system: CiTableResourceState },
  options: CiPlanOptions
): CiPolicyFragment {
  if (!options.includeDefaultDynamoPolicies) return {};

  return {
    inlinePolicies: [
      {
        for: 'ciClearSeederHandler',
        id: 'SystemDdbReadWrite',
        statements: [
          {
            effect: 'Allow',
            actions: [
              'dynamodb:GetItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:DeleteItem',
              'dynamodb:Query',
            ],
            resources: [tables.system.arn],
          },
        ],
      },
      {
        for: 'ciCreateTenantHandler',
        id: 'SystemDdbReadWrite',
        statements: [
          {
            effect: 'Allow',
            actions: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:UpdateItem'],
            resources: [tables.system.arn],
          },
        ],
      },
      {
        for: 'ciDeleteTenantHandler',
        id: 'SystemDdbReadWrite',
        statements: [
          {
            effect: 'Allow',
            actions: ['dynamodb:GetItem', 'dynamodb:DeleteItem'],
            resources: [tables.system.arn],
          },
        ],
      },
      {
        for: 'ciGetTenantHandler',
        id: 'SystemDdbReadOnly',
        statements: [
          {
            effect: 'Allow',
            actions: ['dynamodb:GetItem', 'dynamodb:Query'],
            resources: [tables.system.arn],
          },
        ],
      },
      {
        for: 'ciGetTenantBySlugHandler',
        id: 'SystemDdbReadOnly',
        statements: [
          {
            effect: 'Allow',
            actions: ['dynamodb:GetItem', 'dynamodb:Query'],
            resources: [tables.system.arn],
          },
        ],
      },
      {
        for: 'ciGetTenantLookupBySlugHandler',
        id: 'SystemDdbReadOnly',
        statements: [
          {
            effect: 'Allow',
            actions: ['dynamodb:GetItem', 'dynamodb:Query'],
            resources: [tables.system.arn],
          },
        ],
      },
      {
        for: 'ciListTenantsHandler',
        id: 'SystemDdbReadOnly',
        statements: [
          {
            effect: 'Allow',
            actions: ['dynamodb:Query', 'dynamodb:Scan'],
            resources: [tables.system.arn],
          },
        ],
      },
      {
        for: 'ciSeedTenantsHandler',
        id: 'SystemDdbReadWrite',
        statements: [
          {
            effect: 'Allow',
            actions: ['dynamodb:BatchWriteItem', 'dynamodb:PutItem', 'dynamodb:DeleteItem', 'dynamodb:UpdateItem'],
            resources: [tables.system.arn],
          },
        ],
      },
      {
        for: 'ciUpdateTenantHandler',
        id: 'SystemDdbReadWrite',
        statements: [
          {
            effect: 'Allow',
            actions: ['dynamodb:GetItem', 'dynamodb:UpdateItem'],
            resources: [tables.system.arn],
          },
        ],
      },
    ],
    tableGrants: [
      { for: 'ciClearSeederHandler', table: 'systemTable', actions: ['DeleteItem', 'Query', 'Write'] },
      { for: 'ciCreateTenantHandler', table: 'systemTable', actions: ['GetItem', 'PutItem', 'UpdateItem'] },
      { for: 'ciDeleteTenantHandler', table: 'systemTable', actions: ['GetItem', 'DeleteItem'] },
      { for: 'ciGetTenantHandler', table: 'systemTable', actions: ['GetItem', 'Query'] },
      { for: 'ciGetTenantBySlugHandler', table: 'systemTable', actions: ['GetItem', 'Query'] },
      { for: 'ciGetTenantLookupBySlugHandler', table: 'systemTable', actions: ['GetItem', 'Query'] },
      { for: 'ciListTenantsHandler', table: 'systemTable', actions: ['Query', 'Scan'] },
      {
        for: 'ciSeedTenantsHandler',
        table: 'systemTable',
        actions: ['BatchWriteItem', 'PutItem', 'DeleteItem', 'UpdateItem'],
      },
      { for: 'ciUpdateTenantHandler', table: 'systemTable', actions: ['GetItem', 'UpdateItem'] },
    ],
  };
}
