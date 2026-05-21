"use client";

import { ciResolveAuthProvider } from "../utils";
import type { CiLogoutProps } from "../types";
import { CiAwsLogoutButton } from "../providers";

export function CiLogout({
  redirectTo = "/login",
  provider,
  className,
  label = "Sign out",
}: CiLogoutProps) {
  const ciProvider = ciResolveAuthProvider(provider);

  switch (ciProvider) {
    case "aws":
      return (
        <CiAwsLogoutButton
          redirectTo={redirectTo}
          className={className}
          label={label}
        />
      );

    case "auth0":
    case "azure":
    case "custom":
      throw new Error(
        `CiLogout provider "${ciProvider}" is not implemented in @cloudigniter/next.`,
      );

    default:
      throw new Error(
        `CiLogout received an unsupported provider "${String(ciProvider)}".`,
      );
  }
}
