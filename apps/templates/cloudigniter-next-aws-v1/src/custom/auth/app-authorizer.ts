import { ciCreateAppAuthorizer } from "@cloudigniter/core/lib";

import config from "@/../cloudigniter.config";

import { appAccessControl } from "./app-access-control";

/** Reusable authorizer compiled from the resolved catalog and application policy config. */
export const appAuthorizer = ciCreateAppAuthorizer(
  appAccessControl,
  config.auth.emberguard?.accessControl,
);
