import type { CiUserProfileBase, CiUserRegister } from './';

export type CiUserProfile = CiUserProfileBase & CiUserRegister['Profile'];
