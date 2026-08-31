import { ciDeleteCognitoUserHandler } from "@cloudigniter/aws/server/backend";
import type { Schema } from "../../../data/resource";

type Handler = Schema["DeleteCognitoUser"]["functionHandler"];

export const handler: Handler = async (event, context) =>
  ciDeleteCognitoUserHandler(event, context);
