import { cookies } from "next/headers";
import { createServerRunner } from "@aws-amplify/adapter-nextjs";
import {
  fetchAuthSession,
  getCurrentUser as amplifyGetCurrentUser,
} from "aws-amplify/auth/server";
import type { AuthUser } from "@aws-amplify/auth";

import type { CiAmplifyOutputs } from "@cloudigniter/aws/types";

export type CurrentUserResult = {
  user: AuthUser | null;
  userId: string | null; // token.sub (stable)
  isAuthenticated: boolean;
};

export async function ciAwsGetCurrentUser(
  amplifyOutputs: CiAmplifyOutputs,
): Promise<CurrentUserResult> {
  const { runWithAmplifyServerContext } = createServerRunner({
    config: amplifyOutputs,
  });

  return runWithAmplifyServerContext({
    nextServerContext: { cookies },

    // Type ctx using the real fetchAuthSession signature to avoid implicit any
    operation: async (ctx: Parameters<typeof fetchAuthSession>[0]) => {
      const session = await fetchAuthSession(ctx);

      const sub = session.tokens?.idToken?.payload?.sub;
      const isAuthenticated =
        Boolean(session.tokens?.accessToken) &&
        Boolean(session.tokens?.idToken);

      if (!isAuthenticated) {
        // Normal: anonymous request
        return { user: null, userId: null, isAuthenticated: false };
      }

      // Authenticated: now it's safe/meaningful to ask for the user object
      const user = await amplifyGetCurrentUser(ctx);

      return {
        user,
        userId: typeof sub === "string" ? sub : null,
        isAuthenticated: true,
      };
    },
  });
}
