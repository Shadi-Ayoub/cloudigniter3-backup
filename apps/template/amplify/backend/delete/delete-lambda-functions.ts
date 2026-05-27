import type { Backend } from './types';

// Store references to the functions in an object
export const getFunctions = (backend: Backend) => {
  // const authFunctions = {
  //   createCognitoUserHandler: backend.createCognitoUserHandler.resources.lambda,
  //   getCognitoUserHandler: backend.getCognitoUserHandler.resources.lambda,
  // };

  const dataFunctions = {
    getSettingsHandler: backend.getSettingsHandler.resources.lambda,
    setSettingsHandler: backend.setSettingsHandler.resources.lambda,
    createTenantHandler: backend.createTenantHandler.resources.lambda,
    getTenantHandler: backend.getTenantHandler.resources.lambda,
    deleteTenantHandler: backend.deleteTenantHandler.resources.lambda,
    listTenantsHandler: backend.listTenantsHandler.resources.lambda,
    updateTenantHandler: backend.updateTenantHandler.resources.lambda,
  };
  return {
    // authFunctions,
    dataFunctions,
  };
};
