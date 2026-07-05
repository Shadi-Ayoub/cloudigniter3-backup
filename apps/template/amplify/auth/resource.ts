// See https://docs.aws.amazon.com/amplify/?icmpid=docs_homepage_fewebmobile
// See https://docs.aws.amazon.com/amplify/latest/userguide/welcome.html
// See https://aws-amplify.github.io/amplify-backend/modules/_aws_amplify_backend_auth.html

import { defineAuth } from "@aws-amplify/backend";

import { backendAuth, backendAuthAccess } from "./backend-auth";

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 * @see https://aws-amplify.github.io/amplify-backend/modules/_aws_amplify_auth_construct.html
 *
 */

type AmplifyAuthResource = ReturnType<typeof defineAuth>;

export const auth: AmplifyAuthResource = defineAuth({
  ...backendAuth,
  access: (allow) => [...backendAuthAccess(allow)],
});
