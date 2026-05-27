import type { CiAuthMode, CiEnvMode, CiRequestOptions, CiSeedEnvMode } from "@ci-core/types";
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
export type CiRequest<TInput = unknown, TAuthMode = CiAuthMode, TOptions extends CiRequestOptions = CiRequestOptions> = {
    input: TInput;
    envMode?: CiEnvMode | CiSeedEnvMode;
    authMode?: TAuthMode;
    options?: TOptions;
    critical?: boolean;
};
//# sourceMappingURL=CiRequest.d.ts.map