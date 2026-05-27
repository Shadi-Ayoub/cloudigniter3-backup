import type { PostConfirmationTriggerEvent } from 'aws-lambda';

import type { CiLambdaEvent } from '@cloudigniter/next/types';

export type ProfileRecord = {
  // displayUsername: string;
  email: string;
  // dob: string;
  city: string;
  country: string;
  address: string;
  landline: string;
  mobile: string;
};

/**
 * You can extend the profile fields as per the customised schema.
 *
 * @param event
 * @returns
 */
export function getUserProfileRecord(
  event: PostConfirmationTriggerEvent | CiLambdaEvent,
  postConfirmationEvent = false
) {
  if (postConfirmationEvent) {
    const ev = event as PostConfirmationTriggerEvent;

    const record: ProfileRecord = {
      // displayUsername: ev.request.userAttributes.display_username,
      email: ev.request.userAttributes.email,
      // dob: ev.request.userAttributes.dob,
      city: ev.request.userAttributes.city,
      country: ev.request.userAttributes.country,
      address: ev.request.userAttributes.address,
      landline: ev.request.userAttributes.landline,
      mobile: ev.request.userAttributes.mobile,
    };

    return record;
  }

  const ev = event as CiLambdaEvent;

  const inputString = ev.arguments.inputString;

  if (!inputString || typeof inputString !== 'string') {
    console.log(
      `inputString is required and must be a string. (${inputString})`
    );

    return null;
  }

  const { input } = JSON.parse(inputString);

  const record: ProfileRecord = {
    // displayUsername: input.display_username,
    email: input.email,
    // dob: input.dob,
    city: input.city,
    country: input.country,
    address: input.address,
    landline: input.landline,
    mobile: input.mobile,
  };

  return record;
}
