import { ciSetCognitoUserEnabledHandler } from "@cloudigniter/aws/server/backend";
import type { Schema } from "../../../data/resource";

type Handler = Schema["SetCognitoUserEnabled"]["functionHandler"];

export const handler: Handler = async (event, context) =>
  ciSetCognitoUserEnabledHandler(event, context);
