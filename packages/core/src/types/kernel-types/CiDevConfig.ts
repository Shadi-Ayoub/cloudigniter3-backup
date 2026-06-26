import type { CiTraceConfig } from "@ci-core/types";

export type CiDevConfig = {
  debug: {
    debugProbe: {
      enabled: boolean;
    };
    devBeacon: {
      enabled: boolean;

      /**
       * Keep false until Attribute Role-based Access Control is implemented.
       *
       * When true, production access still requires an authenticated user
       * with the DEVELOPER role.
       */
      allowProduction: boolean;

      requiredRoles: string[];
    };
  };
  traceLog: CiTraceConfig;
};
