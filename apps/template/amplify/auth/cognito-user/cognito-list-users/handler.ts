import { ciListCognitoUsersHandler } from "@cloudigniter/aws/server/backend";
import type { Schema } from "../../../data/resource";

type Handler = Schema["ListCognitoUsers"]["functionHandler"];

export const handler: Handler = async (event, context) =>
  ciListCognitoUsersHandler(event, context);
