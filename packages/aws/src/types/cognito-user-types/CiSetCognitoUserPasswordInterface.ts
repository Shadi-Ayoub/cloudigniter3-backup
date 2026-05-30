import type { AdminSetUserPasswordCommandInput } from "@aws-sdk/client-cognito-identity-provider";
import type { CiSetUserPasswordOptions } from "./CiSetUserPasswordOptions";

export type CiSetCognitoUserPasswordInterface = {
  command: AdminSetUserPasswordCommandInput;
  options?: CiSetUserPasswordOptions;
};
