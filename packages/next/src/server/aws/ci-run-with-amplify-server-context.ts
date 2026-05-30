import { createServerRunner } from "@aws-amplify/adapter-nextjs";
import type { CiAmplifyOutputs } from "@cloudigniter/aws/types";

/**
 * You can use the exported runWithAmplifyServerContext function to call Amplify APIs
 * within isolated request contexts. You can review examples here:
 * https://docs.amplify.aws/nextjs/build-a-backend/server-side-rendering/#calling-amplify-category-apis-on-the-server-side.
 *
 * You only need to call the createServerRunner function once and reuse the runWithAmplifyServerContext function throughout.
 * @param config
 * @returns
 */
export function ciGetAmplifyServerContext(config: CiAmplifyOutputs) {
  const { runWithAmplifyServerContext } = createServerRunner({
    config,
  });

  return runWithAmplifyServerContext;
}
