import { ciUpdateCognitoUserHandler } from "@cloudigniter/aws/server/backend";
import type { Schema } from "../../../data/resource";

type Handler = Schema["UpdateCognitoUser"]["functionHandler"];

export const handler: Handler = async (event, context) =>
  ciUpdateCognitoUserHandler(event, context);
