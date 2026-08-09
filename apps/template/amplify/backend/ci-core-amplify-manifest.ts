import {
  CI_CORE_BACKEND_MANIFEST,
  ciCompileAmplifyBackendBindings,
  ciDefineAmplifyBackendManifest,
} from "@cloudigniter/aws/server/backend";

import { createCognitoUserHandler } from "../auth/cognito-user/cognito-create-user/resource";
import { getCognitoUserHandler } from "../auth/cognito-user/cognito-get-user/resource";
import { setCognitoUserPasswordHandler } from "../auth/cognito-user/cognito-set-user-password/resource";
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

/** Concrete Amplify bindings for the active CloudIgniter backend contract. */
export const CI_CORE_AMPLIFY_MANIFEST = ciDefineAmplifyBackendManifest({
  features: {
    cognitoUsers: {
      status: "active",
      resourceGroupName: "auth",
      functions: {
        ciCreateCognitoUserHandler: {
          backendKey: "createCognitoUserHandler",
          resource: createCognitoUserHandler,
        },
        ciGetCognitoUserHandler: {
          backendKey: "getCognitoUserHandler",
          resource: getCognitoUserHandler,
        },
        ciSetCognitoUserPasswordHandler: {
          backendKey: "setCognitoUserPasswordHandler",
          resource: setCognitoUserPasswordHandler,
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
