import { ciCreateCognitoUserHandler } from "@cloudigniter/aws/server/backend";
import type { Schema } from "../../../data/resource";

type Handler = Schema["CreateCognitoUser"]["functionHandler"];
/**
 * * @param event
 * @returns
 */
export const handler: Handler = async (event, context) => {
  return await ciCreateCognitoUserHandler(event, context);
};
