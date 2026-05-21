import type { CiRequest } from "@cloudigniter/core/types";
import type { CiAwsAuthMode } from "./CiAwsAuthMode";
import type { CiAwsRequestOptions } from "./CiAwsRequestOptions";

/**
 * AWS-specialized CloudIgniter request envelope.
 */
export type CiAwsRequest<TInput = unknown> = CiRequest<
  TInput,
  CiAwsAuthMode,
  CiAwsRequestOptions
>;
