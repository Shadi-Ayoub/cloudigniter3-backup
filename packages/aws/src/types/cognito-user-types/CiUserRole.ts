import type { CiUserCoreRole, CiUserRegister } from "./index";

export type CiUserRole = CiUserCoreRole | CiUserRegister["Roles"];
