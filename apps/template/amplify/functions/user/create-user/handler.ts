import { createUserHandler } from '@cloudigniter/next/server/backend';

import type { Schema } from '../../../data/resource';

type Handler = Schema['createUser']['functionHandler'];
/**
 * * @param event
 * @returns
 */
export const handler: Handler = async (event, context) => {
  return await createUserHandler(event, context);
};
