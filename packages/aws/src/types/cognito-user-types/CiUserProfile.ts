import type { CiUserProfileBase, CiUserRegister } from "./index";

export type CiUserProfile = CiUserProfileBase & CiUserRegister["Profile"];
