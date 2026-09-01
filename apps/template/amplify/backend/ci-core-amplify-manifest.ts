import {
  CI_CORE_BACKEND_MANIFEST,
  ciCompileAmplifyBackendBindings,
  ciDefineAmplifyBackendManifest,
} from "@cloudigniter/aws/server/backend";

import { createCognitoUserHandler } from "../auth/cognito-user/cognito-create-user/resource";
import { getCognitoUserHandler } from "../auth/cognito-user/cognito-get-user/resource";
import { setCognitoUserPasswordHandler } from "../auth/cognito-user/cognito-set-user-password/resource";
import { listCognitoUsersHandler } from "../auth/cognito-user/cognito-list-users/resource";
import { setCognitoUserEnabledHandler } from "../auth/cognito-user/cognito-set-user-enabled/resource";
import { updateCognitoUserHandler } from "../auth/cognito-user/cognito-update-user/resource";
import { deleteCognitoUserHandler } from "../auth/cognito-user/cognito-delete-user/resource";
import { deleteEmberguardCustomDomainHandler } from "../functions/system/emberguard/delete-custom-domain/resource";
import { deleteEmberguardRoleAssignmentHandler } from "../functions/system/emberguard/delete-role-assignment/resource";
import { getEmberguardDefinitionHandler } from "../functions/system/emberguard/get-definition/resource";
import { listEmberguardCustomDomainsHandler } from "../functions/system/emberguard/list-custom-domains/resource";
import { listEmberguardResourceInventoryHandler } from "../functions/system/emberguard/list-resource-inventory/resource";
import { listEmberguardRoleAssignmentsHandler } from "../functions/system/emberguard/list-role-assignments/resource";
import { putEmberguardCustomDomainHandler } from "../functions/system/emberguard/put-custom-domain/resource";
import { putEmberguardResourceInventoryHandler } from "../functions/system/emberguard/put-resource-inventory/resource";
import { putEmberguardRoleAssignmentHandler } from "../functions/system/emberguard/put-role-assignment/resource";
import { setEmberguardDefinitionHandler } from "../functions/system/emberguard/set-definition/resource";
import { deleteTenantHandler } from "../functions/system/tenant/delete-tenant/resource";
import { cleanupSeededTenantsHandler } from "../functions/system/tenant/cleanup-seeded-tenants/resource";
import { listTenantsHandler } from "../functions/system/tenant/list-tenants/resource";
import { purgeTenantHandler } from "../functions/system/tenant/purge-tenant/resource";
import { restoreTenantHandler } from "../functions/system/tenant/restore-tenant/resource";
import { seedTenantsHandler } from "../functions/system/tenant/seed-tenants/resource";
import { setTenantStatusHandler } from "../functions/system/tenant/set-tenant-status/resource";
import { createOrgUnitHandler } from "../functions/system/org-unit/create-org-unit/resource";
import { getOrgUnitByPathHandler } from "../functions/system/org-unit/get-org-unit-by-path/resource";
import { listOrgUnitsHandler } from "../functions/system/org-unit/list-org-units/resource";
import { updateOrgUnitHandler } from "../functions/system/org-unit/update-org-unit/resource";

/** Concrete Amplify bindings for the active CloudIgniter backend contract. */
export const CI_CORE_AMPLIFY_MANIFEST = ciDefineAmplifyBackendManifest({
  features: {
    cognitoUsers: {
      status: "active",
      // These are AppSync resolver functions. Keeping their Cognito and
      // EmberGuard policies in Data preserves the one-way Data -> Auth edge.
      resourceGroupName: "data",
      functions: {
        ciDeleteCognitoUserHandler: {
          backendKey: "deleteCognitoUserHandler",
          resource: deleteCognitoUserHandler,
        },
        ciCreateCognitoUserHandler: {
          backendKey: "createCognitoUserHandler",
          resource: createCognitoUserHandler,
        },
        ciGetCognitoUserHandler: {
          backendKey: "getCognitoUserHandler",
          resource: getCognitoUserHandler,
        },
        ciListCognitoUsersHandler: {
          backendKey: "listCognitoUsersHandler",
          resource: listCognitoUsersHandler,
        },
        ciSetCognitoUserEnabledHandler: {
          backendKey: "setCognitoUserEnabledHandler",
          resource: setCognitoUserEnabledHandler,
        },
        ciSetCognitoUserPasswordHandler: {
          backendKey: "setCognitoUserPasswordHandler",
          resource: setCognitoUserPasswordHandler,
        },
        ciUpdateCognitoUserHandler: {
          backendKey: "updateCognitoUserHandler",
          resource: updateCognitoUserHandler,
        },
      },
    },
    userProfile: {
      status: "active",
      resourceGroupName: "data",
      tables: {
        userProfileTable: {
          modelName: "UserProfile",
          outputName: "userProfileTableName",
        },
      },
    },
    tenantLifecycle: {
      status: "active",
      resourceGroupName: "data",
      functions: {
        ciCleanupSeededTenantsHandler: {
          backendKey: "cleanupSeededTenantsHandler",
          resource: cleanupSeededTenantsHandler,
        },
        ciDeleteTenantHandler: {
          backendKey: "deleteTenantHandler",
          resource: deleteTenantHandler,
        },
        ciListTenantsHandler: {
          backendKey: "listTenantsHandler",
          resource: listTenantsHandler,
        },
        ciPurgeTenantHandler: {
          backendKey: "purgeTenantHandler",
          resource: purgeTenantHandler,
        },
        ciRestoreTenantHandler: {
          backendKey: "restoreTenantHandler",
          resource: restoreTenantHandler,
        },
        ciSeedTenantsHandler: {
          backendKey: "seedTenantsHandler",
          resource: seedTenantsHandler,
        },
        ciSetTenantStatusHandler: {
          backendKey: "setTenantStatusHandler",
          resource: setTenantStatusHandler,
        },
        ciCreateOrgUnitHandler: {
          backendKey: "createOrgUnitHandler",
          resource: createOrgUnitHandler,
        },
        ciGetOrgUnitByPathHandler: {
          backendKey: "getOrgUnitByPathHandler",
          resource: getOrgUnitByPathHandler,
        },
        ciListOrgUnitsHandler: {
          backendKey: "listOrgUnitsHandler",
          resource: listOrgUnitsHandler,
        },
        ciUpdateOrgUnitHandler: {
          backendKey: "updateOrgUnitHandler",
          resource: updateOrgUnitHandler,
        },
      },
      tables: {
        systemTable: {
          modelName: "System",
          outputName: "systemTableName",
        },
      },
    },
    emberguardAccess: {
      status: "active",
      resourceGroupName: "data",
      functions: {
        ciGetEmberguardDefinitionHandler: {
          backendKey: "getEmberguardDefinitionHandler",
          resource: getEmberguardDefinitionHandler,
        },
        ciSetEmberguardDefinitionHandler: {
          backendKey: "setEmberguardDefinitionHandler",
          resource: setEmberguardDefinitionHandler,
        },
        ciListEmberguardRoleAssignmentsHandler: {
          backendKey: "listEmberguardRoleAssignmentsHandler",
          resource: listEmberguardRoleAssignmentsHandler,
        },
        ciPutEmberguardRoleAssignmentHandler: {
          backendKey: "putEmberguardRoleAssignmentHandler",
          resource: putEmberguardRoleAssignmentHandler,
        },
        ciDeleteEmberguardRoleAssignmentHandler: {
          backendKey: "deleteEmberguardRoleAssignmentHandler",
          resource: deleteEmberguardRoleAssignmentHandler,
        },
        ciListEmberguardResourceInventoryHandler: {
          backendKey: "listEmberguardResourceInventoryHandler",
          resource: listEmberguardResourceInventoryHandler,
        },
        ciPutEmberguardResourceInventoryHandler: {
          backendKey: "putEmberguardResourceInventoryHandler",
          resource: putEmberguardResourceInventoryHandler,
        },
        ciListEmberguardCustomDomainsHandler: {
          backendKey: "listEmberguardCustomDomainsHandler",
          resource: listEmberguardCustomDomainsHandler,
        },
        ciPutEmberguardCustomDomainHandler: {
          backendKey: "putEmberguardCustomDomainHandler",
          resource: putEmberguardCustomDomainHandler,
        },
        ciDeleteEmberguardCustomDomainHandler: {
          backendKey: "deleteEmberguardCustomDomainHandler",
          resource: deleteEmberguardCustomDomainHandler,
        },
      },
      tables: {
        emberguardAccessTable: {
          modelName: "EmberguardAccess",
          outputName: "emberguardAccessTableName",
        },
      },
    },
  },
});

const compiledBackend = ciCompileAmplifyBackendBindings(
  CI_CORE_BACKEND_MANIFEST,
  CI_CORE_AMPLIFY_MANIFEST,
);

export const {
  authFunctionBindings: CI_CORE_AMPLIFY_AUTH_FUNCTION_BINDINGS,
  dataFunctionBindings: CI_CORE_AMPLIFY_DATA_FUNCTION_BINDINGS,
  functionBindings: CI_CORE_AMPLIFY_FUNCTION_BINDINGS,
  functionResources: CI_CORE_AMPLIFY_FUNCTION_RESOURCES,
  tableBindings: CI_CORE_AMPLIFY_TABLE_BINDINGS,
} = compiledBackend;
