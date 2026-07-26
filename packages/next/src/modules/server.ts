// ─────────────────────────────────────────────────────────────
// Next.js auth module
// ─────────────────────────────────────────────────────────────
export { ciAuthServerModule } from "./auth/server";

// ─────────────────────────────────────────────────────────────
// Next.js dev beacon module
// ─────────────────────────────────────────────────────────────
export { CiDevBeacon, type CiNexAwsDevBeaconProps } from "./dev/dev-beacon/server";

// ─────────────────────────────────────────────────────────────
// Next.js route module
// ─────────────────────────────────────────────────────────────
export { ciGetCurrentRoute } from "./route/server";
