import { ciDefineServerModule } from "@cloudigniter/core/server";

import { ciModuleManifest } from "../manifest";

export const ciAuthServerModule = ciDefineServerModule({
  manifest: ciModuleManifest,

  register(context) {
    // Server registrations.
  },
});
