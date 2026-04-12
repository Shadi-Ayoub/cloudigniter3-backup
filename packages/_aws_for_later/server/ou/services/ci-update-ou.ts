import { Dynamodb } from '@cloudigniter/next/services/dynamodb/server';
import {
  ciError404,
  ciError500,
  ciNormalizeThrownError,
  ciOk200,
  ciSerializeUnknownError,
  type CiResult,
} from '@cloudigniter/next/core';
import {
  ciWithDdbClient,
  type CiUpdateOrgUnitInterface,
  type CiOrgUnitCommonArgs,
  type CiSystemOrgUnitItem,
} from '@cloudigniter/next/core/server';

import { ciBuildOuPK, ciBuildOuSK } from '../helpers';

// Note: we do NOT change PK/SK here (i.e., we don't move the OU in the tree).
// To change parent or segmentKey, you should delete and recreate.

/**
 * Updates an existing organizational unit record.
 *
 * Behavior:
 * - Updates only mutable fields on the OU item
 * - Does not move the OU in the tree
 * - Returns 404 when the target OU does not exist
 * - Returns the updated item on success
 */
export async function ciUpdateOrgUnit(
  args: CiOrgUnitCommonArgs & { input: CiUpdateOrgUnitInterface }
): Promise<CiResult<CiSystemOrgUnitItem>> {
  const { tableName, clientConfig, input } = args;
  const { tenantId, path, name, description, category, code, meta } = input;

  const ddb = new Dynamodb(clientConfig);

  try {
    return await ciWithDdbClient(ddb, async () => {
      const PK = ciBuildOuPK(tenantId);
      const SK = ciBuildOuSK(path);

      const set: Record<string, unknown> = {};

      if (name !== undefined) set.name = name;
      if (description !== undefined) set.description = description;

      if (category !== undefined) set['data.category'] = category;
      if (code !== undefined) set['data.code'] = code;
      if (meta !== undefined) set['data.meta'] = meta;

      set.updatedAt = new Date().toISOString();

      const update = await ddb.writeItem<CiSystemOrgUnitItem, { PK: string; SK: string }>({
        tableName,
        key: { PK, SK },
        mode: 'update',
        existence: 'updateOnly',
        update: { set },
        returnValues: 'ALL_NEW',
      });

      if (!update.ok) {
        if (update.statusCode === 400) {
          return ciError404(`ORG_UNIT_UPDATE: OrgUnit "${path}" not found for tenant "${tenantId}".`);
        }

        return ciError500(
          update.body.error || 'ORG_UNIT_UPDATE: Failed to update organizational unit.',
          update.body.details
        );
      }

      if (!update.body.attributes) {
        return ciError500('ORG_UNIT_UPDATE: Update succeeded but no updated attributes were returned.');
      }

      return ciOk200(update.body.attributes as CiSystemOrgUnitItem);
    });
  } catch (error) {
    const ciError = ciNormalizeThrownError(error);

    return ciError500(
      ciError.message || 'ORG_UNIT_UPDATE: Unexpected error while updating organizational unit.',
      ciSerializeUnknownError(error)
    );
  } finally {
    ddb.destroy();
  }
}
