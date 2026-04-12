import type { CiEnvMode } from './CiEnvMode';

// Seeder-specific env mode (explicitly excludes "live")
export type CiSeedEnvMode = Extract<CiEnvMode, 'test' | 'sandbox'>;
