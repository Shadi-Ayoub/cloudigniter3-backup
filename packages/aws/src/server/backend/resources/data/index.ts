// ─────────────────────────────────────────────────────────────
// Imports (required for local usage)
// ─────────────────────────────────────────────────────────────

import { ciEmberguardAccessTableResourceModule } from "./emberguard-access-table";
// import { ciPrivateSettingsTableResourceModule } from "./private-settings-table";
// import { ciPublicSettingsTableResourceModule } from "./public-settings-table";
// import { ciSystemTableResourceModule } from "./system-table";
import { ciUserProfileTableResourceModule } from "./user-profile-table";
// import { ciUserSettingsTableResourceModule } from "./user-settings-table";

// ─────────────────────────────────────────────────────────────
// Re-exports (optional but recommended)
// ─────────────────────────────────────────────────────────────

export {
  ciEmberguardAccessTableResourceModule,
  // ciPrivateSettingsTableResourceModule,
  // ciPublicSettingsTableResourceModule,
  // ciSystemTableResourceModule,
  ciUserProfileTableResourceModule,
  // ciUserSettingsTableResourceModule,
};

// ─────────────────────────────────────────────────────────────
// Combined Export (for registry consumption)
// ─────────────────────────────────────────────────────────────

export const CI_DATA_RESOURCE_MODULES = [
  ciEmberguardAccessTableResourceModule,
  // ciPrivateSettingsTableResourceModule,
  // ciPublicSettingsTableResourceModule,
  // ciSystemTableResourceModule,
  ciUserProfileTableResourceModule,
  // ciUserSettingsTableResourceModule,
] as const;
