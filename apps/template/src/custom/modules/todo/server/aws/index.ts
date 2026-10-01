import { ciCreateAwsTodoModule } from "@cloudigniter/aws/server/backend";
import { ciModuleManifest } from "../../manifest";

export const ciModuleBackend = ciCreateAwsTodoModule(ciModuleManifest);
