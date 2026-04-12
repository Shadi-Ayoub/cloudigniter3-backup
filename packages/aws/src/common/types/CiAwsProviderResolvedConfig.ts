import type { CiAmplifyOutputs } from "../../";

/**
 * AWS provider-specific resolved config fragment.
 */
export type CiAwsProviderResolvedConfig = {
  amplifyOutputs?: CiAmplifyOutputs;
};
