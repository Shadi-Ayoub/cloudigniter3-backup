import type { CiUserRole } from "./CiUserRole";

export interface CiUserProfileBase {
  email: string;
  role: CiUserRole;
  isActive: boolean;
}
