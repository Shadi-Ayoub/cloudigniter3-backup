import type { CiUserCoreRole, CiUserRegister } from './';

export type CiUserRole = CiUserCoreRole | CiUserRegister['Roles'];
