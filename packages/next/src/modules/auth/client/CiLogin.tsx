"use client";

import { ciResolveAuthProvider } from "@ci-next/lib";
import type { CiLoginProps } from "@ci-next/types";
import { CiNextAwsLogin } from "./providers/aws";

export function CiLogin({ redirectTo = "/", provider }: CiLoginProps) {
  const ciProvider = ciResolveAuthProvider(provider);

  switch (ciProvider) {
    case "aws":
      return <CiNextAwsLogin redirectTo={redirectTo} />;

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
