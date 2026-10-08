import type { PostConfirmationTriggerHandler } from 'aws-lambda';
import { type Schema } from '../../data/resource';
import { generateClient } from 'aws-amplify/data';
// import { Logger } from '@aws-lambda-powertools/logger';
import { Amplify } from 'aws-amplify';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';

import { env } from '$amplify/env/post-confirmation-handler';

import './config';
// import { createUserProfile } from '../../graphql/mutations';
import { getUserProfileRecord } from '../../custom';

// const logger = new Logger({
//   logLevel: 'INFO',
//   serviceName: 'Post Confirmation',
// });

const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(env);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

export const handler: PostConfirmationTriggerHandler = async (event) => {
  const profile = getUserProfileRecord(event, true);
  if (profile !== null) {
    const subjectId = event.request.userAttributes.sub;
    if (!subjectId) {
      throw new Error("Cognito post confirmation did not include a subject ID.");
    }
    await client.models.UserProfile.create({
      userId: subjectId,
      username: event.userName,
      profileOwner: `${subjectId}::${event.userName}`,
      roles: ["user"],
      deletionState: "active",
      ...profile,
    });
  } else {
    const msg = `Error in Post Confirmation Lambda: could not generate a profile record!`;
    console.error(msg);
    // logger.error(msg);
  }

  return event;
};
