import type { CiAwsStatus } from "@cloudigniter/aws/types";

export type CiNextStatus = {
  providers?: {
    aws?: CiAwsStatus;
  };
};
