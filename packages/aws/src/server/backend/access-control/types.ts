export type CiBootstrapAccessControlInput = {
  region: string;
  bootstrapFunctionName: string;
  accessControlTableName: string;
};

export type CiBootstrapAccessControlFromAmplifyAppInput = {
  appRoot?: string;
  amplifyOutputsPath?: string;
  profile?: string;
};

export type CiBootstrapAccessControlResult = {
  accessControlTableName: string;
  created: boolean;
  revision?: number;
};
