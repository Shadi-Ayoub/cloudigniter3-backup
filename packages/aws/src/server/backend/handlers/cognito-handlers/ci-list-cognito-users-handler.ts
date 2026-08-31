import { ciCreateDirectHandler, ciListCognitoUsers } from "@ci-aws/lib";

/** Lists a bounded page of normalized Cognito identities. */
export const ciListCognitoUsersHandler = ciCreateDirectHandler({
  moduleUrl: import.meta.url,
  service: ciListCognitoUsers,
});
