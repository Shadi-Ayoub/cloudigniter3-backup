import { Dynamodb } from '@cloudigniter/next/services/dynamodb/server';
import {
  ciError500,
  ciNormalizeThrownError,
  ciOk200,
  ciSerializeUnknownError,
  type CiResult,
} from '@cloudigniter/next/core';
import {
  ciWithDdbClient,
  type CiGetOrgUnitTreeInterface,
  type CiOrgUnitCommonArgs,
  type CiOrgUnitNode,
  type CiSystemOrgUnitItem,
} from '@cloudigniter/next/core/server';

import { ciBuildOuPK } from '../helpers';

/**
 * Converts a stored OU record into a tree node shape.
 */
function toNode(item: CiSystemOrgUnitItem): CiOrgUnitNode {
  const { tenantId, name, description, createdAt, updatedAt, data } = item;
  const { path, parentPath, category, code, meta } = data ?? {};

  return {
    tenantId,
    path: String(path ?? ''),
    parentPath: (parentPath as string | null) ?? null,
    name,
    description,
    category: category as string | undefined,
    code: code as string | undefined,
    meta: (meta as Record<string, unknown> | undefined) ?? undefined,
    createdAt,
    updatedAt,
    children: [],
  };
}

/**
 * Loads and builds the organizational unit tree for a tenant.
 *
 * Behavior:
 * - Reads all OU records for the tenant
 * - Converts them into tree nodes
 * - Reconstructs parent/child relationships in memory
 * - Returns root nodes
 *
 * Notes:
 * - Orphan nodes are treated as roots
 */
export async function ciGetOrgUnitTree(
  args: CiOrgUnitCommonArgs & { input: CiGetOrgUnitTreeInterface }
): Promise<CiResult<CiOrgUnitNode[]>> {
  const { tableName, clientConfig, input } = args;
  const { tenantId } = input;

  const ddb = new Dynamodb(clientConfig);

  try {
    return await ciWithDdbClient(ddb, async () => {
      const query = await ddb.queryItems<CiSystemOrgUnitItem>({
        TableName: tableName,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
          ':pk': ciBuildOuPK(tenantId),
        },
      });

      if (!query.ok) {
        return ciError500(
          query.body.error || 'ORG_UNIT_TREE: Failed to query organizational units.',
          query.body.details
        );
      }

      const items = query.body.items;
      const nodes = items.map(toNode);
      const byPath = new Map<string, CiOrgUnitNode>();

      for (const node of nodes) {
        byPath.set(node.path, node);
      }

      const roots: CiOrgUnitNode[] = [];

      for (const node of nodes) {
        if (!node.parentPath) {
          roots.push(node);
          continue;
        }

        const parent = byPath.get(node.parentPath);

        if (parent) {
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      }

      return ciOk200(roots);
    });
  } catch (error) {
    const ciError = ciNormalizeThrownError(error);

    return ciError500(
      ciError.message || 'ORG_UNIT_TREE: Unexpected error while loading the organizational unit tree.',
      ciSerializeUnknownError(error)
    );
  } finally {
    ddb.destroy();
  }
}
