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
  userId: string | null;
  groups: readonly string[];
  isAuthenticated: boolean;
  email: string | null;
  emailVerified: boolean | null;
  displayName: string | null;
  username: string | null;
  signInId: string | null;
  authFlow: string | null;
  sessionExpiresAt: string | null;
  accessToken: string | null;
  idToken: string | null;
};

function ciGetStringArrayClaim(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function ciGetStringClaim(
  payload: Record<string, unknown>,
  claim: string,
): string | null {
  const value = payload[claim];

  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function ciGetBooleanClaim(
  payload: Record<string, unknown>,
  claim: string,
): boolean | null {
  const value = payload[claim];

  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return null;
}

function ciGetDisplayName(payload: Record<string, unknown>): string | null {
  const name = ciGetStringClaim(payload, "name");

  if (name) {
    return name;
  }

  const displayName = [
    ciGetStringClaim(payload, "given_name"),
    ciGetStringClaim(payload, "family_name"),
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return displayName || null;
}

function ciFormatUnixTimestamp(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return new Date(value * 1_000).toISOString();
}

export async function ciAwsGetCurrentUser(
  amplifyOutputs: CiAmplifyOutputs,
): Promise<CurrentUserResult> {
  const { runWithAmplifyServerContext } = createServerRunner({
    config: amplifyOutputs,
  });

  return runWithAmplifyServerContext({
    nextServerContext: { cookies },

    operation: async (ctx: Parameters<typeof fetchAuthSession>[0]) => {
      const session = await fetchAuthSession(ctx);

      const accessToken = session.tokens?.accessToken;
      const idToken = session.tokens?.idToken;

      if (!accessToken || !idToken) {
        return {
          user: null,
          userId: null,
          groups: [],
          isAuthenticated: false,
          email: null,
          emailVerified: null,
          displayName: null,
          username: null,
          signInId: null,
          authFlow: null,
          sessionExpiresAt: null,
          accessToken: null,
          idToken: null,
        };
      }

      // Both tokens are now narrowed as defined.
      const sub = idToken.payload.sub;

      const groups = ciGetStringArrayClaim(
        accessToken.payload["cognito:groups"],
      );

      const user = await amplifyGetCurrentUser(ctx);

      return {
        user,
        userId: typeof sub === "string" ? sub : null,
        groups,
        isAuthenticated: true,
        email: ciGetStringClaim(idToken.payload, "email"),
        emailVerified: ciGetBooleanClaim(idToken.payload, "email_verified"),
        displayName: ciGetDisplayName(idToken.payload),
        username: user.username,
        signInId: user.signInDetails?.loginId?.trim() || null,
        authFlow: user.signInDetails?.authFlowType ?? null,
        sessionExpiresAt: ciFormatUnixTimestamp(accessToken.payload.exp),
        accessToken: accessToken.toString(),
        idToken: idToken.toString(),
      };
    },
  });
}

// import { cookies } from "next/headers";
// import { createServerRunner } from "@aws-amplify/adapter-nextjs";
// import {
//   fetchAuthSession,
//   getCurrentUser as amplifyGetCurrentUser,
// } from "aws-amplify/auth/server";
// import type { AuthUser } from "@aws-amplify/auth";

// import type { CiAmplifyOutputs } from "@cloudigniter/aws/types";

// export type CurrentUserResult = {
//   user: AuthUser | null;
//   userId: string | null; // token.sub (stable)
//   isAuthenticated: boolean;
// };

// export async function ciAwsGetCurrentUser(
//   amplifyOutputs: CiAmplifyOutputs,
// ): Promise<CurrentUserResult> {
//   const { runWithAmplifyServerContext } = createServerRunner({
//     config: amplifyOutputs,
//   });

//   return runWithAmplifyServerContext({
//     nextServerContext: { cookies },

//     // Type ctx using the real fetchAuthSession signature to avoid implicit any
//     operation: async (ctx: Parameters<typeof fetchAuthSession>[0]) => {
//       const session = await fetchAuthSession(ctx);

//       const sub = session.tokens?.idToken?.payload?.sub;
//       const isAuthenticated =
//         Boolean(session.tokens?.accessToken) &&
//         Boolean(session.tokens?.idToken);

//       if (!isAuthenticated) {
//         // Normal: anonymous request
//         return { user: null, userId: null, isAuthenticated: false };
//       }

//       // Authenticated: now it's safe/meaningful to ask for the user object
//       const user = await amplifyGetCurrentUser(ctx);

//       return {
//         user,
//         userId: typeof sub === "string" ? sub : null,
//         isAuthenticated: true,
//       };
//     },
//   });
// }
