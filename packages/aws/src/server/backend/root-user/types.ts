export type CiRootUserPasswordPolicy = {
  minLength?: number;
  requireLowercase?: boolean;
  requireUppercase?: boolean;
  requireNumbers?: boolean;
  requireSymbols?: boolean;
};

export type CiRootUserConfig = {
  email: string;
  givenName: string;
  familyName: string;
};

export type CiBootstrapRootUserInput = {
  region: string;
  userPoolId: string;
  userProfileTableName: string;
  rootUser: CiRootUserConfig;
  passwordPolicy?: CiRootUserPasswordPolicy;
  passwordProvider: () => Promise<string>;
  groups?: readonly string[];
};

export type CiBootstrapRootUserResult = {
  email: string;
  username: string;
  userId: string;
  cognitoSub: string;
  profileOwner: string;
  groups: readonly string[];
  isRootUser: true;
  cognitoUserCreated: boolean;
  passwordSet: boolean;
};

export type CiBootstrapRootUserFromAmplifyAppInput = {
  appRoot?: string;
  amplifyOutputsPath?: string;
  rootUserConfigPath?: string;
  profile?: string;
  passwordProvider?: () => Promise<string>;
};
