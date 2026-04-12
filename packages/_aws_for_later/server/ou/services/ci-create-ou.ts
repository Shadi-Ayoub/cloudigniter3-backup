import {
  ciError400,
  ciError500,
  ciOk200,
  ciSerializeUnknownError,
  type CiResult,
} from "@cloudigniter/core";
import { ciNormalizeThrownError } from "@cloudigniter/core/server";

import { ciWithDdbClient, Dynamodb } from "../../";

import {
  type CiCreateOrgUnitInterface,
  type CiOrgUnitCommonArgs,
  type CiOrgUnitData,
  type CiSystemOrgUnitItem,
} from "@cloudigniter/core/server";

import { ciBuildOuPK, ciBuildOuSK } from "../helpers";

/**
 * Creates a new organizational unit record.
 *
 * Behavior:
 * - Builds the OU path from `parentPath` + `segmentKey`
 * - Fails when the same OU already exists for the tenant
 * - Returns the created item on success
 *
 * Implementation notes:
 * - Uses the CloudIgniter `Dynamodb` wrapper
 * - Uses Result-style responses only
 */
export async function ciCreateOrgUnit(
  args: CiOrgUnitCommonArgs & { input: CiCreateOrgUnitInterface },
): Promise<CiResult<CiSystemOrgUnitItem>> {
  const { tableName, clientConfig, input } = args;
  const {
    tenantId,
    parentPath,
    segmentKey,
    name,
    description,
    category,
    code,
    meta,
  } = input;

  const ddb = new Dynamodb(clientConfig);

  try {
    return await ciWithDdbClient(ddb, async () => {
      const path =
        parentPath == null || parentPath === ""
          ? segmentKey
          : `${parentPath}/${segmentKey}`;

      const PK = ciBuildOuPK(tenantId);
      const SK = ciBuildOuSK(path);

      const nowIso = new Date().toISOString();

      const data: CiOrgUnitData = {
        path,
        parentPath: parentPath ?? null,
        tenantId,
        category,
        code,
        meta,
      };

      const item: CiSystemOrgUnitItem = {
        PK,
        SK,
        type: "ORG_UNIT",
        tenantId,
        name,
        description,
        data,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      const put = await ddb.writeItem<
        CiSystemOrgUnitItem,
        { PK: string; SK: string }
      >({
        tableName,
        key: { PK, SK },
        item,
        mode: "put",
        existence: "insertOnly",
        returnValues: "NONE",
      });

      if (!put.ok) {
        if (put.statusCode === 400) {
          return ciError400(
            `ORG_UNIT_CREATE: Org Unit "${path}" already exists for tenant "${tenantId}".`,
          );
        }

        return ciError500(
          put.body.error ||
            "ORG_UNIT_CREATE: Failed to create organizational unit.",
          put.body.details,
        );
      }

      return ciOk200(item);
    });
  } catch (error) {
    const ciError = ciNormalizeThrownError(error);

    return ciError500(
      ciError.message ||
        "ORG_UNIT_CREATE: Unexpected error while creating organizational unit.",
      ciSerializeUnknownError(error),
    );
  } finally {
    ddb.destroy();
  }
}
