import { ciGetCognitoUserHandler } from '@cloudigniter/next/server/backend';
import type { Schema } from '../../../data/resource';

type Handler = Schema['GetCognitoUser']['functionHandler'];

export const handler: Handler = async (event, context) => {
  // throw Error(JSON.stringify(event));
  return ciGetCognitoUserHandler(event, context);
};
