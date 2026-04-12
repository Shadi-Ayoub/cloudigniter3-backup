"use client";

import { ciResolveAuthProvider } from "../utils/ci-resolve-auth-provider";
import type { CiLoginProps } from "../types";
import { CiAwsLoginInternal } from "../providers/aws";

export function CiLogin({ redirectTo = "/", provider }: CiLoginProps) {
  const ciProvider = ciResolveAuthProvider(provider);

  switch (ciProvider) {
    case "aws":
      return <CiAwsLoginInternal redirectTo={redirectTo} />;

    case "auth0":
    case "azure":
    case "custom":
      throw new Error(
        `CiLogin provider "${ciProvider}" is not implemented in @cloudigniter/next.`,
      );

    default:
      throw new Error(
        `CiLogin received an unsupported provider "${String(ciProvider)}".`,
      );
  }
}
