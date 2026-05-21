export { ciResolveNextAwsAuthMode, ciGetNextAmplifyServerRunner } from "./aws";

export {
  ciGetCookies,
  ciGetNextServerCookie,
  ciSetNextServerCookie,
} from "./cookie";

export {
  CI_DEFAULT_TENANT_ROUTING_OPTIONS,
  ciGetBypassFlag,
  ciGetHost,
  ciIsInternalPath,
  ciIsStaticFile,
  ciGetRequestPath,
  ciHandleRouteLogic,
  ciHandleTenantLogic,
  ciRewriteToRouteInfoPage,
  ciBuildTenantRewritePath,
  ciLookupTenant,
  ciNextProxyMatcher,
  ciNextProxyResponse,
  ciResolveTenant,
  ciResolveTenantFromSlugPath,
  ciResolveTenantFromSubdomain,
  ciRewriteToTenantInfoPage,
} from "./proxy";

// TBD
export * from "../settings/server";
export * from "../ui/server";
///////

export { CiPageWrapper, CiRootWrapper } from "../wrapper/server";

export type { CiServerErrorPayload } from "./types";
