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
  type CiGetOrgUnitInterface,
  type CiOrgUnitCommonArgs,
  type CiSystemOrgUnitItem,
} from '@cloudigniter/next/core/server';

import { ciBuildOuPK, ciBuildOuSK } from '../helpers';

/**
 * Loads a single organizational unit record by tenant and path.
 *
 * Behavior:
 * - Reads the exact OU item using a strongly consistent read
 * - Returns 404 when the OU does not exist
 * - Returns the stored OU item on success
 */
export async function ciGetOrgUnit(
  args: CiOrgUnitCommonArgs & { input: CiGetOrgUnitInterface }
): Promise<CiResult<CiSystemOrgUnitItem>> {
  const { tableName, clientConfig, input } = args;
  const { tenantId, path } = input;

  const ddb = new Dynamodb(clientConfig);

  try {
    return await ciWithDdbClient(ddb, async () => {
      const read = await ddb.readItem<CiSystemOrgUnitItem, { PK: string; SK: string }>({
        tableName,
        key: { PK: ciBuildOuPK(tenantId), SK: ciBuildOuSK(path) },
        consistent: true,
      });

      if (!read.ok) {
        return ciError500(read.body.error || 'ORG_UNIT_GET: Failed to read organizational unit.', read.body.details);
      }

      if (!read.body.item) {
        return ciError404(`ORG_UNIT_GET: OrgUnit "${path}" not found for tenant "${tenantId}".`);
      }

      return ciOk200(read.body.item);
    });
  } catch (error) {
    const ciError = ciNormalizeThrownError(error);

    return ciError500(
      ciError.message || 'ORG_UNIT_GET: Unexpected error while loading organizational unit.',
      ciSerializeUnknownError(error)
    );
  } finally {
    ddb.destroy();
  }
}
