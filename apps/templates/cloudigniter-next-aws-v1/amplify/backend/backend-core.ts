import { auth } from "../auth/resource";
import { manageModulesHandler } from "../functions/system/modules/manage/resource";
import { executeModuleHandler } from "../functions/system/modules/execute/resource";
import { data } from "../data/resource";
import { CI_CORE_AMPLIFY_FUNCTION_RESOURCES } from "./ci-core-amplify-manifest";

/** Core resource shape derived from the package-compiled Amplify manifest. */
export const coreResources = {
  auth,
  data,
  manageModulesHandler,
  executeModuleHandler,
  ...CI_CORE_AMPLIFY_FUNCTION_RESOURCES,
};
