import type { CiEnvMode } from "./CiEnvMode";

/** Environment mode in which application seeders are permitted to execute. */
export type CiSeedEnvMode = Extract<CiEnvMode, "development">;
