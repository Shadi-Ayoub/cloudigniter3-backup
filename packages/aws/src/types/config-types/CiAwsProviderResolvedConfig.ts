import type { CiAmplifyOutputs } from "@ci-aws/types";

/**
 * AWS provider-specific resolved config fragment.
 */
export type CiAwsProviderResolvedConfig = {
  amplifyOutputs?: CiAmplifyOutputs;
};
