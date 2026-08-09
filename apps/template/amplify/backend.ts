import { defineBackend } from "@aws-amplify/backend";
import { config as loadEnv } from "dotenv";
import path from "node:path";

import { ciPostBuild } from "./backend/ci-post-build";
import { backendShape } from "./backend/types";
import { ciConfigureCustomBackend } from "./custom/backend";

// Enable loading environment variables from the .env file into process.env
loadEnv({
  path: path.join(process.cwd(), "amplify", ".env"),
});

const backend = defineBackend(backendShape);

ciPostBuild(backend);
ciConfigureCustomBackend({ backend });
