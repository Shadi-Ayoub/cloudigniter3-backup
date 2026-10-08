import type { PostConfirmationTriggerEvent } from "aws-lambda";

import type { CiLambdaEvent } from "@cloudigniter/aws/types";

import type { CIUserProfile } from "@cloudigniter/core/types";

export type ProfileRecord = CIUserProfile & {
  email: string;
  emailVerified?: boolean;
  status: "active";
};

function ciIsRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function ciCreateProfileRecord(
  input: Record<string, unknown>,
  source: string,
): ProfileRecord | null {
  const email = input.email;
  if (typeof email !== "string") {
    console.log(
      `[getUserProfileRecord] Invalid or incomplete profile data received from ${source}.`,
    );

    return null;
  }

  return {
    email,
    ...(input.email_verified !== undefined
      ? { emailVerified: input.email_verified === "true" }
      : {}),
    ...(typeof input.given_name === "string"
      ? { givenName: input.given_name }
      : {}),
    ...(typeof input.middle_name === "string"
      ? { middleName: input.middle_name }
      : {}),
    ...(typeof input.family_name === "string"
      ? { familyName: input.family_name }
      : {}),
    displayName: [input.given_name, input.family_name]
      .filter((part): part is string => typeof part === "string" && Boolean(part))
      .join(" "),
    status: "active",
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
