import { ciCreateAppAuthorizer } from "@cloudigniter/core/lib";

import { appAccessControl } from "./app-access-control";

/** Reusable authorizer compiled from the default resolved application catalog. */
export const appAuthorizer = ciCreateAppAuthorizer(appAccessControl);
