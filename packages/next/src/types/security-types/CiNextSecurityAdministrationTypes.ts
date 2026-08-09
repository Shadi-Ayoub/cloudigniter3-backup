import type { CiAwsEmberguardGraphqlOperations } from "@cloudigniter/aws/types";
import type {
  CiAccessControlDefinition,
  CiSecurityAdministrationOptions,
} from "@cloudigniter/core/types";
import type { CiNextContext } from "../app-types";

export type CiNextSecurityAdministrationOptions = Omit<
  CiSecurityAdministrationOptions,
  "actor"
> & {
  context: CiNextContext;
};

export type CiNextAwsSecurityAdministrationOptions = {
  context: CiNextContext;
  definition: CiAccessControlDefinition;
  amplifyOutputs: unknown;
  operations: CiAwsEmberguardGraphqlOperations;
  createId?: () => string;
};
