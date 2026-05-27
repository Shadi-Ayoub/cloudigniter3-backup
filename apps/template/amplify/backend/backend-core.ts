import { auth } from '../auth/resource';
import { data } from '../data/resource';
import { getLambdaParametersHandler } from '../functions/system/get-lambda-parameters/resource';
import { getSettingsHandler } from '../functions/system/settings/get-settings/resource';
import { setSettingsHandler } from '../functions/system/settings/set-settings/resource';
import { createCognitoUserHandler } from '../auth/cognito-user/cognito-create-user/resource';
import { getCognitoUserHandler } from '../auth/cognito-user/cognito-get-user/resource';
import { createTenantHandler } from '../functions/system/tenant/create-tenant/resource';
import { deleteTenantHandler } from '../functions/system/tenant/delete-tenant/resource';
import { getTenantHandler } from '../functions/system/tenant/get-tenant/resource';
import { listTenantsHandler } from '../functions/system/tenant/list-tenants/resource';
import { updateTenantHandler } from '../functions/system/tenant/update-tenant/resource';
import { createUserHandler } from '../functions/user/create-user/resource';
import { seedTenantsHandler } from '../functions/system/tenant/seed-tenants/resource';

export const coreResources = {
  auth,
  data,
  //Cognito
  getCognitoUserHandler,
  createCognitoUserHandler,
  //lambda
  getLambdaParametersHandler,
  //Settings
  getSettingsHandler,
  setSettingsHandler,
  //Tenant
  createTenantHandler,
  deleteTenantHandler,
  getTenantHandler,
  listTenantsHandler,
  updateTenantHandler,
  createUserHandler,
  seedTenantsHandler,
};

export type CoreBackendKeys = keyof typeof coreResources;
