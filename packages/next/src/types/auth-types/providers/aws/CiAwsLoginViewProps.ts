import type { AuthUser } from "aws-amplify/auth";

export type CiAwsLoginViewProps = {
  user?: AuthUser;
  redirectTo?: string;
};
