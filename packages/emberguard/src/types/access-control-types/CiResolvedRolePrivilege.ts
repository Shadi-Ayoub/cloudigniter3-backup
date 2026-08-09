import type { CiPrivilege } from "./CiPrivilege";

/** Internal compiled privilege paired with the role that declared it. */
export type CiResolvedRolePrivilege = {
  privilege: CiPrivilege;
  privilegeRoleId: string;
};
