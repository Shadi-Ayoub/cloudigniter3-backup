export type CiAwsEmberguardGraphqlOperations = {
  getDefinition(): Promise<unknown>;
  saveDefinition(inputString: string): Promise<unknown>;
  listRoleAssignments(): Promise<unknown>;
  putRoleAssignment(inputString: string): Promise<unknown>;
  deleteRoleAssignment(inputString: string): Promise<unknown>;
};
