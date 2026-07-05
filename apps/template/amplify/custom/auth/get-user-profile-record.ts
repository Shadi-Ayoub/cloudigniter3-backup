import type { PostConfirmationTriggerEvent } from "aws-lambda";

import type { CiLambdaEvent } from "@cloudigniter/aws/types";

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

function ciIsRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function ciCreateProfileRecord(
  input: Record<string, unknown>,
  source: string,
): ProfileRecord | null {
  const email = input.email;
  const city = input.city;
  const country = input.country;
  const address = input.address;
  const landline = input.landline;
  const mobile = input.mobile;

  if (
    typeof email !== "string" ||
    typeof city !== "string" ||
    typeof country !== "string" ||
    typeof address !== "string" ||
    typeof landline !== "string" ||
    typeof mobile !== "string"
  ) {
    console.log(
      `[getUserProfileRecord] Invalid or incomplete profile data received from ${source}.`,
    );

    return null;
  }

  return {
    // displayUsername: input.display_username,
    email,
    // dob: input.dob,
    city,
    country,
    address,
    landline,
    mobile,
  };
}

/**
 * You can extend the profile fields as per the customised schema.
 *
 * @param event
 * @returns
 */
export function getUserProfileRecord(
  event: PostConfirmationTriggerEvent | CiLambdaEvent,
  postConfirmationEvent = false,
): ProfileRecord | null {
  if (postConfirmationEvent) {
    const ev = event as PostConfirmationTriggerEvent;

    return ciCreateProfileRecord(
      ev.request.userAttributes,
      "Cognito post-confirmation event",
    );
  }

  const ev = event as CiLambdaEvent;
  const inputString = ev.arguments.inputString;

  if (!inputString || typeof inputString !== "string") {
    console.log(
      `inputString is required and must be a string. (${inputString})`,
    );

    return null;
  }

  try {
    const payload: unknown = JSON.parse(inputString);

    if (!ciIsRecord(payload) || !ciIsRecord(payload.input)) {
      console.log(
        "[getUserProfileRecord] inputString must contain an object with an input property.",
      );

      return null;
    }

    return ciCreateProfileRecord(payload.input, "Lambda input");
  } catch {
    console.log("[getUserProfileRecord] inputString is not valid JSON.");

    return null;
  }
}
