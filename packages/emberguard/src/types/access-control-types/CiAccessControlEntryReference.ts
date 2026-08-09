/** The ownership classes exposed to access-control administration tooling. */
export type CiAccessControlEntryOrigin = "core" | "application";

/** Stable reference to one administrable access-control catalog entry. */
export type CiAccessControlEntryReference =
  | { kind: "domain"; domainId: string }
  | { kind: "resource"; resourceId: string }
  | { kind: "action"; resourceId: string; actionId: string }
  | { kind: "role"; roleId: string }
  | { kind: "privilege"; roleId: string; privilegeId: string };
