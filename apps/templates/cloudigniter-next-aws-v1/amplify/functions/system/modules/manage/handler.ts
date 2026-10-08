import { ciCreateAwsExtensionHandlers } from "@cloudigniter/aws/server/backend";
import { extensionBackends } from "../../../../../src/custom/modules/.generated/aws";
import type { Schema } from "../../../../data/resource";
const handlers = ciCreateAwsExtensionHandlers({
  framework: "next",
  definitions: extensionBackends,
});
export const handler: Schema["ManageModules"]["functionHandler"] = (event) =>
  handlers.manage(event);
