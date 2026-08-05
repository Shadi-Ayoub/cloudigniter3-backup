import type { CiPrivilege } from "./CiPrivilege";

/** Reusable role/group and its privilege set. */
export type CiRoleDefinition = {
  id: string;
  title: string;
  description?: string;

  /** Lower numbers have higher precedence, matching Amazon Cognito semantics. */
  precedence: number;

  /** Roles whose privileges this role inherits. */
  inherits?: readonly string[];
  privileges: readonly CiPrivilege[];
};
