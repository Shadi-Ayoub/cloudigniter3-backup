"use client";

import { ciDefineClientModule } from "@cloudigniter/core/client";

import { ciModuleManifest } from "../manifest";

export const ciAuthClientModule = ciDefineClientModule({
  manifest: ciModuleManifest,

  register(context) {
    // Client registrations.
  },
});
