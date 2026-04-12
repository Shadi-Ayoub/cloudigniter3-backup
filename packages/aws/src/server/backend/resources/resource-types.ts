export type CiTableResourceState = {
  name: string;
  arn: string;
};

export type CiBucketResourceState = {
  name: string;
  arn: string;
};

export type CiUserPoolResourceState = {
  userPoolId: string;
  userPoolArn: string;
  clientId?: string;
};

export type CiApiResourceState = {
  name: string;
  url: string;
  arn?: string;
};

export type CiAuthResourceState = {
  /**
   * Marker resource for auth domain participation in the registry.
   * Keep minimal for now; direct auth ids/arns can still flow through `extra.auth`.
   */
  enabled: true;
};

export type CiCoreResources = {
  privateSettingsTable: CiTableResourceState;
  publicSettingsTable: CiTableResourceState;
  systemTable: CiTableResourceState;
  userProfileTable: CiTableResourceState;
  userSettingsTable: CiTableResourceState;
  auth: CiAuthResourceState;
};
