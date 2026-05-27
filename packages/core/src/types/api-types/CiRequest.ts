import type {
  CiAuthMode,
  CiEnvMode,
  CiRequestOptions,
  CiSeedEnvMode,
} from "@ci-core/types";

/**
 * Provider-neutral request envelope used by CloudIgniter service clients.
 *
 * TInput:
 * Request payload type.
 *
 * TAuthMode:
 * Provider-specific auth mode type. Defaults to core CiAuthMode.
 *
 * TOptions:
 * Provider-specific request options bag.
 */
export type CiRequest<
  TInput = unknown,
  TAuthMode = CiAuthMode,
  TOptions extends CiRequestOptions = CiRequestOptions,
> = {
  input: TInput; // parameters object sent to the backend operation.for the AppSync handler (used by the corresponding cloudigniter server method)
  envMode?: CiEnvMode | CiSeedEnvMode; // Runtime environment mode. Defaults to 'test'
  authMode?: TAuthMode; // Authorization mode used by the provider-specific client.
  options?: TOptions; // Optional provider-specific request options.
  // scope: string; // Needed to resolve authorization
  // action: string; // Needed to resolve authorization
  critical?: boolean; // If true, failures should throw rather than return a normal error result. defaults to false.
};
