"use server";

import { ciAwsGetCurrentUser } from "@cloudigniter/next/server";
import type { CiAmplifyOutputs } from "@cloudigniter/aws/types";
import outputs from "@/../amplify_outputs.json";

const config = outputs as CiAmplifyOutputs;

export async function appGetCurrentUser() {
  const result = await ciAwsGetCurrentUser(config);

  return result;
}
