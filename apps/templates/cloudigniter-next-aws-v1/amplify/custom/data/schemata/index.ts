import { ciMergeAmplifyDataSchemas } from "@cloudigniter/aws/server/backend";

import generatedDataEntitySchemas from "./registry.generated";

/**
 * Hand-written application schemas belong here. Resource Studio never rewrites
 * this file or the manual fragment.
 */
const manualCustomDataSchemas = {};

const extendedSchemas = ciMergeAmplifyDataSchemas(
  manualCustomDataSchemas,
  generatedDataEntitySchemas,
);

export default extendedSchemas;
