import type { CiUserStatus } from "./CiUserStatus";

export interface CiDataTableUserRecord {
  id: string;
  email: string;
  groups: string;
  createdAt: string;
  justCreated?: boolean; // still boolean
  lastActiveAt?: string;
  status?: Exclude<CiUserStatus, "inactive" | "active">; // still string-union

  /**
   * Any additional key → must be a string
   * (but we also include boolean|undefined so our known props still type-check)
   */
  [key: string]: string | boolean | undefined;
}
