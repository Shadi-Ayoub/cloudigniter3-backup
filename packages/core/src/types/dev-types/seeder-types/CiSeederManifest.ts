import type { CiSeederDefinition } from "./CiSeederDefinition";

export type CiSeederManifest = {
  version: 1;
  seeders: readonly CiSeederDefinition[];
};
