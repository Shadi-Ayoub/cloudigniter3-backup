import { auth } from "../auth/resource";
import { data } from "../data/resource";
import { CI_CORE_AMPLIFY_FUNCTION_RESOURCES } from "./ci-core-amplify-manifest";

/** Core resource shape derived from the package-compiled Amplify manifest. */
export const coreResources = {
  auth,
  data,
  ...CI_CORE_AMPLIFY_FUNCTION_RESOURCES,
};
