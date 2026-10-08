import { ciSetCognitoUserPasswordHandler } from "@cloudigniter/aws/server/backend";
import type { Schema } from "../../../data/resource";

type Handler = Schema["SetCognitoUserPassword"]["functionHandler"];

export const handler: Handler = async (event, context) => {
  return ciSetCognitoUserPasswordHandler(event, context);
};
